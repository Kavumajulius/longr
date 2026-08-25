import puppeteer from "puppeteer-core";

const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const EMAIL = process.env.E2E_EMAIL || `e2e+${Date.now()}@longr-test.dev`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--window-size=1400,1000"],
    defaultViewport: { width: 1400, height: 1000 },
  });

  const page = await browser.newPage();
  page.on("console", async (msg) => {
    let text = msg.text();
    try {
      const args = msg.args();
      if (args?.length) text = (await Promise.all(args.map((a) => a.jsonValue().catch(() => "?")))).join(" ");
    } catch {}
    if (/WhopCheckoutEmbed|payment|checkout|error/i.test(text)) console.log("BROWSER:", text.slice(0, 400));
  });
  page.on("pageerror", (err) => console.log("PAGEERROR:", err.message.slice(0, 300)));
  page.on("response", (res) => {
    if (res.url().includes("/api/whop")) {
      console.log("API:", res.request().method(), res.url().replace(APP, ""), res.status());
    }
  });

  console.log("1. Open onboarding…");
  await page.goto(APP + "/", { waitUntil: "networkidle2", timeout: 90000 });

  // Walk the funnel
  for (let i = 0; i < 70; i++) {
    await sleep(900);
    const state = await page.evaluate(() => ({
      hasCta: [...document.querySelectorAll("button")].some((b) => !b.disabled && /get full longr access/i.test(b.textContent || "")),
      body: (document.body.innerText || "").slice(0, 200),
    }));
    if (state.hasCta) { console.log(">> PAYWALL REACHED"); break; }

    // name / email inputs
    const typed = await page.evaluate((email) => {
      const setVal = (el, val) => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        set.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const fn = document.querySelector("#first-name");
      if (fn && !fn.value) setVal(fn, "Alex");
      const em = document.querySelector("#plan-email");
      if (em && !em.value) setVal(em, email);
      if (fn || em) {
        const btn = [...document.querySelectorAll("button.cta-btn")].find(
          (b) => !b.disabled && /see my healthy years profile|continue to my plan/i.test(b.textContent || ""),
        );
        if (btn) { btn.click(); return fn ? "name+go" : "email+go"; }
        return fn ? "name-typed" : "email-typed";
      }
      return null;
    }, EMAIL);
    if (typed) { console.log("typed:", typed); continue; }

    const clicked = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")].filter((b) => !b.disabled && b.offsetParent);
      const exact = [
        "Start My 16 Questions", "Continue", "Continue My Profile", "Keep Going",
        "Build My Profile", "Build My Longr Plan", "Send Me My Plan",
        "See My Healthy Years Profile", "Continue to My Plan",
        "Spin the Wheel", "Claim My Discount", "Get Started", "Start",
      ];
      for (const t of exact) {
        const b = buttons.find((x) => (x.textContent || "").trim() === t);
        if (b) { b.click(); return "btn:" + t; }
      }
      const choice = document.querySelector(".quiz-choice");
      if (choice) { choice.click(); return "quiz-choice"; }
      const land = document.querySelector(
        ".lc-cta-primary:not([disabled]), .lc-cta-secondary:not([disabled]), .lc-cta-outline:not([disabled]), .lc-guarantee-btn:not([disabled]), .lc-bio-cta:not([disabled])",
      );
      if (land) { land.click(); return "landing-cta"; }
      return null;
    });
    console.log(i, clicked ?? "…waiting: " + state.body.replace(/\n/g, " ").slice(0, 80));
  }

  const ctaOk = await page.evaluate(() =>
    [...document.querySelectorAll("button")].some((b) => !b.disabled && /get full longr access/i.test(b.textContent || "")),
  );
  if (!ctaOk) {
    console.log("FAILED to reach paywall");
    await page.screenshot({ path: "work/e2e-stuck.png", fullPage: false });
    await browser.close();
    process.exit(1);
  }

  console.log("\n2. Wait prefetch, then click GET FULL LONGR ACCESS");
  await sleep(5000);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /get full longr access/i.test(x.textContent || ""));
    b?.click();
  });

  // Wait for whop iframe
  let whopFrame = null;
  for (let i = 0; i < 70; i++) {
    await sleep(1000);
    whopFrame = page.frames().find((f) => f.url().includes("whop.com/embedded/checkout"));
    if (whopFrame) break;
    if (i === 69) {
      const modalHtml = await page.evaluate(() => document.querySelector(".checkout-modal-overlay")?.outerHTML?.slice(0, 1500) ?? document.body.innerHTML.slice(0, 800));
      console.log("modal state:", modalHtml);
      const err = await page.evaluate(() => document.querySelector(".checkout-modal-error, .auth-error")?.textContent ?? "");
      console.log("visible error:", err);
    }
  }
  if (!whopFrame) {
    console.log("NO WHOP IFRAME FOUND");
    await page.screenshot({ path: "work/e2e-no-iframe.png" });
    await browser.close();
    process.exit(1);
  }
  console.log("Whop iframe URL:", whopFrame.url());
  await sleep(6000);

  const innerText = await whopFrame.evaluate(() => document.body.innerText).catch(() => "");
  console.log("\n--- iframe text ---\n" + String(innerText).slice(0, 1200));
  await page.screenshot({ path: "work/e2e-checkout-open.png" });

  // Enumerate payment method options
  const methods = await whopFrame.evaluate(() =>
    [...document.querySelectorAll("[role=tab],[role=radio],button,label")].map((e) => (e.textContent || "").trim()).filter(Boolean).slice(0, 30),
  ).catch(() => []);
  console.log("\nmethod-ish elements:", JSON.stringify(methods));

  // Try to find card fields (may be nested Stripe frames)
  console.log("\nchild frames of whop frame:");
  for (const cf of whopFrame.childFrames()) {
    console.log(" -", cf.url().slice(0, 110));
  }

  // ── Fill card form inside the Whop iframe and click Confirm ──
  console.log("\n5. Fill card details and click Confirm secure payment…");
  const fillRes = await whopFrame.evaluate(() => {
    const setVal = (el, val) => {
      const proto = el.tagName === "SELECT" ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value").set;
      setter.call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll("input")];
    const byMatch = (re) => inputs.find((i) => re.test((i.name || "") + " " + (i.id || "") + " " + (i.placeholder || "") + " " + (i.getAttribute("aria-label") || "") + " " + (i.autocomplete || "")));
    let log = [];
    const email = document.querySelector('input[type="email"], input[name*=email i], input[autocomplete=email]');
    if (email) { setVal(email, "e2e-card-test@longr-test.dev"); log.push("email"); }
    const num = byMatch(/card.?number|1234/i) || inputs.find((i) => i.placeholder?.includes("1234"));
    if (num) { setVal(num, "4242424242424242"); log.push("number"); }
    const exp = byMatch(/exp|MM/i) || inputs.find((i) => i.placeholder?.includes("MM"));
    if (exp) { setVal(exp, "12/40"); log.push("exp"); }
    const cvc = byMatch(/cvc|cvv|security/i) || inputs.find((i) => i.placeholder?.toUpperCase().includes("CVC"));
    if (cvc) { setVal(cvc, "123"); log.push("cvc"); }
    const name = document.querySelector("input[autocomplete*=name i]:not([autocomplete=email])");
    if (name && !name.value) { setVal(name, "Alex Tester"); log.push("name"); }
    return log;
  }).catch((e) => ["FILL ERROR: " + e.message]);
  console.log("filled (whop frame):", JSON.stringify(fillRes));

  // Card fields live inside Basis Theory hosted-element child iframes
  for (const cf of whopFrame.childFrames()) {
    const url = cf.url();
    if (!url.includes("basistheory")) continue;
    try {
      const res = await cf.evaluate(() => {
        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(el, val);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const inputs = [...document.querySelectorAll("input")];
        return { count: inputs.length, list: inputs.map((i) => ({ name: i.name, id: i.id, ph: i.placeholder, type: i.type, aria: i.getAttribute("aria-label") })) };
      });
      console.log("basis-theory frame:", url.slice(0, 80), JSON.stringify(res));
      const typed = await cf.evaluate(() => {
        const setVal = (el, val) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          setter.call(el, val);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
        };
        const inputs = [...document.querySelectorAll("input")];
        let did = [];
        for (const i of inputs) {
          const key = ((i.placeholder || "") + " " + (i.getAttribute("aria-label") || "")).toLowerCase();
          if (/number|1234/.test(key)) { setVal(i, "4242424242424242"); did.push("num"); }
          else if (/mm|exp/.test(key)) { setVal(i, "1240"); did.push("exp"); }
          else if (/cvc|cvv/.test(key)) { setVal(i, "123"); did.push("cvc"); }
          else if (/postal|zip/.test(key)) { setVal(i, "10001"); did.push("zip"); }
        }
        return did;
      });
      console.log("typed into BT frame:", JSON.stringify(typed));
    } catch (e) {
      console.log("BT frame eval failed:", e.message.slice(0, 150));
    }
  }
  await sleep(1500);

  // Track XHR/fetch inside the whop frame after submit click
  await whopFrame.evaluate(() => {
    window.__netlog = [];
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      window.__netlog.push("fetch " + String(args[0]).slice(0, 140));
      return origFetch.apply(this, args);
    };
    const xo = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u) {
      window.__netlog.push(m + " " + String(u).slice(0, 140));
      return xo.apply(this, arguments);
    };
  }).catch(() => {});

  await page.screenshot({ path: "work/e2e-filled.png" });
  const clickedConfirm = await whopFrame.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) => /confirm secure payment/i.test(b.textContent || ""));
    if (!btn) return false;
    btn.click();
    return true;
  }).catch(() => false);
  console.log("clicked confirm:", clickedConfirm);

  // Observe for 15s
  for (let t = 0; t < 6; t++) {
    await sleep(2500);
    const state = await Promise.all([
      whopFrame.evaluate(() => ({
        net: window.__netlog ?? [],
        body: document.body.innerText.slice(0, 600),
      })).catch(() => null),
      page.evaluate(() => ({
        err: document.querySelector(".checkout-modal-error")?.textContent ?? "",
        modalOpen: !!document.querySelector(".checkout-modal-overlay"),
      })).catch(() => null),
    ]);
    console.log(`t+${(t + 1) * 2.5}s`, JSON.stringify(state));
  }

  await page.screenshot({ path: "work/e2e-after-confirm.png", fullPage: false });

  console.log("\nDone.");
  await browser.close();
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
