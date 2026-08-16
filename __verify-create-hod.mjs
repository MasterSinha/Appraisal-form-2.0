import { chromium } from "playwright";

const dirEmail = "dircsea@gmail.com";
const dirPassword = "123456";
const testHodEmail = `test.hod.${Date.now()}@gmail.com`;

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const context = await browser.newContext();
const page = await context.newPage();
page.on("console", (msg) => { if (msg.type() === "error") console.log("[console error]", msg.text().slice(0, 200)); });

await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
await page.fill('input[type="email"]', dirEmail);
await page.fill('input[type="password"]', dirPassword);
await page.click('button:has-text("Login")');
await page.waitForURL("**/dashboard", { timeout: 15000 });
await page.waitForTimeout(1500);

await page.click('text="Manage Programs"').catch(() => page.click('text="Manage Departments"'));
await page.waitForTimeout(1500);

const createButtons = await page.locator('button:has-text("Create HOD")').all();
console.log("Create HOD buttons found:", createButtons.length);
if (createButtons.length === 0) { console.log("No programs to test with."); await browser.close(); process.exit(0); }

// Find which program this first button belongs to.
const programName = await createButtons[0].locator("xpath=../..").locator("span").first().innerText();
console.log("Testing with program:", programName);

await createButtons[0].click();
await page.waitForTimeout(500);

await page.fill('input[name="name"]', "Test HOD Account");
await page.fill('input[name="email"]', testHodEmail);
await page.fill('input[name="employeeId"]', `TESTHOD${Date.now() % 100000}`);
await page.fill('input[name="designation"]', "Associate Professor");
await page.fill('input[name="password"]', "TestPass123");

await page.click('button:has-text("Create & Assign HOD")');
await page.waitForTimeout(2500);

const bodyText = await page.evaluate(() => document.body.innerText);
const idx = bodyText.indexOf("HOD account created");
console.log("Success message found:", idx >= 0 ? bodyText.slice(idx, idx + 100) : "NOT FOUND");
const errIdx = bodyText.search(/Could not create HOD/);
if (errIdx >= 0) console.log("Error message:", bodyText.slice(errIdx, errIdx + 200));

await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });

// Now log in as the newly created HOD to confirm it works and has the right department.
await page.goto("http://localhost:5173/login", { waitUntil: "domcontentloaded" });
await page.fill('input[type="email"]', testHodEmail);
await page.fill('input[type="password"]', "TestPass123");
await page.click('button:has-text("Login")');
const ok = await page.waitForURL("**/dashboard", { timeout: 10000 }).then(() => true).catch(() => false);
console.log("New HOD account login succeeded:", ok);
if (ok) {
  await page.waitForTimeout(1500);
  const session = await page.evaluate(() => ({
    role: sessionStorage.getItem("role"),
    school: sessionStorage.getItem("school"),
    department: sessionStorage.getItem("department"),
    departments: sessionStorage.getItem("departments"),
  }));
  console.log("New HOD session:", session);
}

await browser.close();
