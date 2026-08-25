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
  page.on("console", async (msg) => {
    const t = msg.text();
    if (/WhopCheckoutEmbed|payment|error|fail/i.test(t)) console.log("BROWSER:", t.slice(0, 300));
  });

  // Fast-path: seed localStorage so we could skip quiz? Onboarding reads saved answers,
  // but stage always starts at landing. Just walk the funnel quickly.
  await page.goto(APP + "/", { waitUntil: "networkidle2", timeout: 90000 });
  for (let i = 0; i < 70; i++) {
    await sleep(700);
    const done = await page.evaluate((email) => {
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
      const hasCta = buttons.some((b) => /get full longr access/i.test(b.textContent || ""));
      if (hasCta) return true;
      const exact = ["Start My 16 Questions", "Continue", "Continue My Profile", "Keep Going", "Build My Profile", "Build My Longr Plan", "Send Me My Plan", "See My Healthy Years Profile", "Continue to My Plan", "Spin the Wheel", "Claim My Discount"];
      for (const t of exact) {
        const b = buttons.find((x) => (x.textContent || "").trim() === t);
        if (b) { b.click(); return false; }
      }
      const choice = document.querySelector(".quiz-choice");
      if (choice) { choice.click(); return false; }
      const land = document.querySelector(".lc-cta-primary:not([disabled]), .lc-cta-secondary:not([disabled]), .lc-guarantee-btn:not([disabled])");
      if (land) { land.click(); }
      return false;
    }, EMAIL);
    if (done) break;
  }

  console.log("paywall reached, waiting for prefetch…");
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
  console.log("iframe up:", whopFrame.url().slice(0, 120));
  await sleep(5000);

  // List every input in the whop frame
  const inputs = await whopFrame.evaluate(() =>
    [...document.querySelectorAll("input, textarea")].map((i) => ({
      tag: i.tagName, name: i.name || null, id: i.id || null, type: i.type || null,
      ph: i.placeholder || null, aria: i.getAttribute("aria-label"), ac: i.autocomplete || null,
      rect: (() => { const r = i.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; })(),
    })),
  );
  console.log("whop-frame inputs:", JSON.stringify(inputs, null, 1));
  await browser.close();
}

main().catch((e) => { console.error("FATAL", e); process.exit(1); });
