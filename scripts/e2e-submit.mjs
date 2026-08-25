import puppeteer from "puppeteer-core";

const APP = process.env.APP_URL || "http://localhost:3000";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const EMAIL = `e2e+${Date.now()}@longr-test.dev`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1400, height: 1000 },
  });
  const page = await browser.newPage();

  // funnel
  await page.goto(APP + "/", { waitUntil: "networkidle2", timeout: 90000 });
  let done = false;
  for (let i = 0; i < 80 && !done; i++) {
    await sleep(1000);
    done = await page.evaluate((email) => {
      const setVal = (el, val) => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        set.call(el, val);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      };
      const fn = document.querySelector("#first-name");
      if (fn && !fn.value) setVal(fn, "Alex");
      const em = document.querySelector("#plan-email");
      if (em && !em.value) setVal(em, email);
      const buttons = [...document.querySelectorAll("button")].filter((b) => !b.disabled && b.offsetParent);
      if (buttons.some((b) => /get full longr access/i.test(b.textContent || ""))) return true;
      const exact = ["Start My 16 Questions", "Continue", "Continue My Profile", "Keep Going", "Build My Profile", "Build My Longr Plan", "Send Me My Plan", "See My Healthy Years Profile", "Continue to My Plan", "Spin the Wheel", "Claim My Discount"];
      for (const t of exact) {
        const b = buttons.find((x) => (x.textContent || "").trim() === t);
        if (b) { b.click(); return false; }
      }
      const choice = document.querySelector(".quiz-choice");
      if (choice) { choice.click(); return false; }
      const land = document.querySelector(".lc-cta-primary:not([disabled]), .lc-cta-secondary:not([disabled]), .lc-cta-outline:not([disabled]), .lc-guarantee-btn:not([disabled])");
      if (land) { land.click(); return false; }
      return false;
    }, EMAIL);
    if (done) break;
  }
  if (!done) { console.log("FUNNEL FAILED to reach paywall"); await page.screenshot({ path: "work/e2e-funnel-stuck.png" }); process.exit(1); }
  console.log("paywall reached");
  await sleep(4000);
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /get full longr access/i.test(b.textContent || ""))?.click();
  });
  let whopFrame = null;
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    whopFrame = page.frames().find((f) => f.url().includes("whop.com/embedded/checkout"));
    if (whopFrame) break;
  }
  if (!whopFrame) { console.log("no iframe"); process.exit(1); }
  console.log("iframe up");
  await sleep(5000);

  // Fill email in whop frame
  await whopFrame.type('input[type="email"]', EMAIL, { delay: 10 });
  console.log("email typed");

  // Find nested element iframes (Basis Theory hosted fields)
  const btFrames = await whopFrame.evaluate(() =>
    [...document.querySelectorAll("iframe")].map((f) => {
      const r = f.getBoundingClientRect();
      return { src: f.src.slice(0, 90), x: r.x, y: r.y, w: r.width, h: r.height };
    }),
  );
  console.log("nested iframes:", JSON.stringify(btFrames, null, 1));

  // Type into each BT field using real keyboard events at their viewport coords.
  // Order assumption: number, expiry, cvc (top→bottom).
  const fields = btFrames.filter((f) => f.src.includes("basistheory") && f.w > 20 && f.h > 10);
  const values = ["4242424242424242", "1240", "123"];
  for (let i = 0; i < Math.min(fields.length, values.length); i++) {
    const f = fields[i];
    const cx = f.x + f.w / 2, cy = f.y + f.h / 2;
    // coords are relative to whop iframe; convert: whop iframe offset within page
    const off = await page.evaluate(() => {
      const el = document.querySelector('iframe[title="Whop Embedded Checkout"]');
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    });
    await page.mouse.click(off.x + cx, off.y + cy);
    await sleep(300);
    await page.keyboard.type(values[i], { delay: 25 });
    await sleep(300);
    console.log(`typed ${values[i]} into field ${i} @`, cx, cy);
  }

  await page.screenshot({ path: "work/e2e-card-typed.png" });

  // instrument network in whop frame
  await whopFrame.evaluate(() => {
    window.__netlog = [];
    const origFetch = window.fetch;
    window.fetch = function (...args) {
      window.__netlog.push("fetch " + String(args[0]).slice(0, 160));
      return origFetch.apply(this, args);
    };
    const xo = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (m, u) {
      window.__netlog.push(m + " " + String(u).slice(0, 160));
      return xo.apply(this, arguments);
    };
  });

  // Click Confirm secure payment
  await whopFrame.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /confirm secure payment/i.test(b.textContent || ""))?.click();
  });
  console.log("clicked confirm");

  let sawPaymentPost = false;
  for (let t = 0; t < 12; t++) {
    await sleep(2500);
    const state = await Promise.all([
      whopFrame.evaluate(() => ({ net: window.__netlog ?? [], body: document.body.innerText })).catch(() => null),
      page.evaluate(() => ({
        err: document.querySelector(".checkout-modal-error")?.textContent ?? "",
        paidScreen: !!document.querySelector(".paywall-success"),
      })).catch(() => null),
    ]).catch(() => null);
    const net = state?.[0]?.net ?? [];
    const payCalls = net.filter((n) => /payment|purchase|checkout|confirm|intent/i.test(n));
    if (payCalls.length && !sawPaymentPost) {
      sawPaymentPost = true;
      console.log("PAYMENT NETWORK CALLS:", JSON.stringify(payCalls, null, 1));
    }
    const body = state?.[0]?.body ?? "";
    if (/processing|declined|failed|error|incorrect/i.test(body)) {
      console.log(`t+${(t + 1) * 2.5}s BODY CHANGE:`, body.replace(/\n+/g, " | ").slice(0, 400));
    }
    if (state?.[1]?.paidScreen) { console.log("PAID SCREEN SHOWN"); break; }
  }

  const finalBody = await whopFrame.evaluate(() => document.body.innerText).catch(() => "");
  console.log("\nFINAL iframe body:", finalBody.replace(/\n+/g, " | ").slice(0, 700));
  const parentState = await page.evaluate(() => ({
    err: document.querySelector(".checkout-modal-error")?.textContent ?? "",
    paid: !!document.querySelector(".paywall-success"),
  }));
  console.log("parent:", JSON.stringify(parentState));
  await page.screenshot({ path: "work/e2e-final.png", fullPage: false });
  await browser.close();
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
