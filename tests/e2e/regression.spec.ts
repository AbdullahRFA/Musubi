import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

/**
 * End-to-end regression of every main workflow with two fresh members:
 * Hana (68, Older Generation) and Ken (21, Younger Generation).
 * Creates real data in the configured Supabase project.
 */
const stamp = Date.now().toString().slice(-6);
const HANA = { name: "Hana Sato", email: `qa.hana.${stamp}@example.com`, age: "68", pw: "QaPass2026" };
const KEN = { name: "Ken Tanaka", email: `qa.ken.${stamp}@example.com`, age: "21", pw: "QaPass2026" };
const TITLE = `QA video call help ${stamp}`;

test.describe.configure({ mode: "serial" });

let hanaCtx: BrowserContext, kenCtx: BrowserContext;
let hana: Page, ken: Page;
const pageErrors: string[] = [];

async function newMember(browser: Browser, label: string) {
  const ctx = await browser.newContext({ geolocation: { latitude: 32.7736, longitude: 129.8659 }, permissions: ["geolocation"] });
  await ctx.addInitScript(() => { if (!localStorage.getItem("tsunagu_lang")) localStorage.setItem("tsunagu_lang", "en"); });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => pageErrors.push(`[${label}] ${e.message}`));
  page.on("dialog", (d) => d.accept());
  return { ctx, page };
}

/** A chat bubble with this text (message bodies are marked data-no-translate). */
const bubble = (page: Page, text: string) => page.locator("[data-no-translate]", { hasText: text }).last();

async function go(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function register(page: Page, u: typeof HANA) {
  await go(page, "/register");
  await page.fill("#fullName", u.name);
  await page.fill("#email", u.email);
  await page.fill("#password", u.pw);
  await page.fill("#age", u.age);
  await page.click("button[type=submit]");
  await page.waitForURL((url) => !url.pathname.startsWith("/register"), { timeout: 60_000 });
}

async function completeProfile(page: Page, opts: { bio: string; skill: string; customSlot?: boolean; pin?: boolean }) {
  await go(page, "/profile/edit");
  await page.fill("#pe-bio", opts.bio);
  if (opts.pin) {
    await page.getByRole("button", { name: "Use my current location" }).click();
    await expect(page.locator("#my-location-name")).not.toHaveValue("", { timeout: 20_000 });
  } else {
    await page.getByPlaceholder(/Search neighborhood/).fill("Urakami");
    await page.keyboard.press("Enter");
  }
  await page.getByPlaceholder(/Search a skill \(e\.g\. Origami, Tech help\)/).fill(opts.skill);
  await page.keyboard.press("Enter");
  if (opts.customSlot) {
    await page.getByRole("button", { name: /Add a specific date & time/ }).click();
    await page.fill("#pe-avail-date", "2027-01-09");
    await page.fill("#pe-avail-start", "10:00");
    await page.fill("#pe-avail-end", "12:00");
    await page.getByRole("button", { name: "Add time" }).click();
    await expect(page.getByText("Sat 9 Jan 2027, 10:00–12:00")).toBeVisible();
  }
  await page.getByRole("button", { name: /Save Profile/ }).click();
  await page.waitForURL(/\/profile\/[0-9a-f-]{36}$/, { timeout: 30_000 });
}

test.beforeAll(async ({ browser }) => {
  ({ ctx: hanaCtx, page: hana } = await newMember(browser, "Hana"));
  ({ ctx: kenCtx, page: ken } = await newMember(browser, "Ken"));
});

test.afterAll(async () => {
  await hanaCtx?.close();
  await kenCtx?.close();
});

test("public pages load without errors", async () => {
  for (const path of ["/", "/posts", "/about", "/search", "/login", "/register", "/forgot-password"]) {
    await go(hana, path);
    await expect(hana.locator("main, #main-content").first()).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("sign-up enforces the minimum age", async () => {
  await go(hana, "/register");
  await hana.fill("#fullName", "Too Young");
  await hana.fill("#email", `qa.young.${stamp}@example.com`);
  await hana.fill("#password", "QaPass2026");
  await hana.fill("#age", "14");
  await hana.click("button[type=submit]");
  await expect(hana.getByText(/at least 15/)).toBeVisible();
  await expect(hana).toHaveURL(/\/register/);
});

test("two members register; posting is gated until the profile is complete", async () => {
  await register(hana, HANA);
  await register(ken, KEN);
  await go(hana, "/posts/new");
  await expect(hana.getByText(/Complete your profile/i).first()).toBeVisible();
  await completeProfile(hana, { bio: "Retired teacher who loves cooking and origami.", skill: "Origami", pin: true, customSlot: true });
  await expect(hana.getByText("Sat 9 Jan 2027, 10:00–12:00", { exact: false })).toBeVisible();
  await completeProfile(ken, { bio: "Student who loves technology and helping neighbours.", skill: "Smartphone" });
});

test("Hana publishes a paid post at her own location", async () => {
  await go(hana, "/posts/new");
  await expect(hana.locator("#pf-location option:checked")).toContainText("my location");
  await hana.locator("#pf-category").selectOption({ label: "Technology" });
  await hana.fill("#pf-title", TITLE);
  await hana.fill("#pf-skill", "Smartphone video calls");
  await hana.fill("#pf-description", "Please teach me how to video call my grandchildren on my new phone.");
  await hana.getByRole("radio", { name: /Paid/ }).click();
  await hana.getByRole("button", { name: "£10" }).click();
  await hana.locator("button[type=submit]").last().click();
  await hana.waitForURL(/\/posts\/(?!new)[^/]+$/, { timeout: 30_000 });
  await expect(hana.getByRole("heading", { name: TITLE })).toBeVisible();
});

test("search finds the post by keyword", async () => {
  await go(ken, "/search?q=" + encodeURIComponent("QA video call"));
  await expect(ken.getByText(TITLE).first()).toBeVisible();
});

test("Ken responds and Hana accepts", async () => {
  await go(ken, "/posts");
  await ken.getByText(TITLE).first().click();
  await ken.locator("form textarea").first().fill("Hi Hana! I can help this weekend.");
  await ken.getByRole("button", { name: /Send Service Request/ }).click();
  await expect(ken.getByText(/already responded|Response sent/i).first()).toBeVisible();

  // Fresh tab straight onto Requests: the requester's real name must show
  const fresh = await hanaCtx.newPage();
  await go(fresh, "/requests");
  await expect(fresh.getByText("Hi Hana! I can help this weekend.")).toBeVisible();
  await expect(fresh.getByText("Ken Tanaka").first()).toBeVisible();
  await expect(fresh.getByText("Community Member")).toHaveCount(0);
  await fresh.close();

  await go(hana, "/requests");
  await expect(hana.getByText("Hi Hana! I can help this weekend.")).toBeVisible();
  await hana.getByRole("button", { name: /^Accept$/ }).first().click();
  await hana.waitForURL(/my-activity/, { timeout: 30_000 });
});

test("both can chat in real time", async () => {
  await go(hana, "/chat");
  await hana.getByPlaceholder(/Message Ken/).fill("Is Saturday at 2pm OK?");
  await hana.keyboard.press("Enter");
  await go(ken, "/chat");
  await expect(bubble(ken, "Is Saturday at 2pm OK?")).toBeVisible();
  await ken.getByPlaceholder(/Message Hana/).fill("Perfect, see you then!");
  await ken.keyboard.press("Enter");
  await expect(bubble(hana, "Perfect, see you then!")).toBeVisible({ timeout: 20_000 });
});

test("the payer must pay before completing, then can review", async () => {
  await go(ken, "/my-activity?tab=inprogress");
  await ken.getByRole("button", { name: /Mark Completed/ }).first().click();
  await expect(ken.getByText(/Waiting for|marked this activity completed/i).first()).toBeVisible();

  await go(hana, "/my-activity?tab=inprogress");
  await hana.getByRole("button", { name: /Mark Completed/ }).first().click();
  await expect(hana.getByText("Complete the payment first")).toBeVisible();
  await hana.getByRole("button", { name: /Pay .* now/ }).click();
  await expect(hana.getByText("Payment complete")).toBeVisible({ timeout: 20_000 });
  await hana.getByRole("button", { name: /Mark as completed/ }).click();
  await hana.waitForURL(/feedback/, { timeout: 30_000 });
  await hana.getByRole("button", { name: "5 stars" }).click();
  await hana.locator("textarea").first().fill("Ken was so patient!");
  await hana.locator("button[type=submit]").last().click();
  await go(hana, "/transactions");
  await expect(hana.getByText(/£10/).first()).toBeVisible();
});

test("profiles count the completed exchange (fresh session)", async () => {
  const kenProfile = await ken.locator('header a[href^="/profile/"]').first().getAttribute("href");
  const fresh = await hanaCtx.browser()!.newContext();
  const page = await fresh.newPage();
  await page.addInitScript(() => localStorage.setItem("tsunagu_lang", "en"));
  await go(page, "/login");
  await page.fill("#email", HANA.email);
  await page.fill("#password", HANA.pw);
  await page.click("button[type=submit]");
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
  await go(page, kenProfile!);
  const tile = page.locator("div", { has: page.getByText("Completed Exchanges", { exact: true }) }).last();
  await expect(tile).toContainText("1");
  await fresh.close();
});

test("completed posts disappear from the public list", async () => {
  await go(ken, "/posts");
  await expect(ken.getByText(TITLE)).toHaveCount(0);
});

test("connections: request, accept, private messages with edit, react and delete", async () => {
  const hanaProfile = await hana.locator('header a[href^="/profile/"]').first().getAttribute("href");
  await go(ken, hanaProfile!);
  await ken.getByRole("button", { name: /^Connect$/ }).click();
  await expect(ken.getByRole("button", { name: /Requested|Cancel request/ })).toBeVisible();

  await go(hana, "/connections?tab=requests");
  await hana.getByRole("button", { name: /^Accept$/ }).first().click();
  await go(hana, "/connections");
  await hana.locator('a[href^="/connections/chat/"]').first().click();
  const box = hana.getByRole("textbox", { name: "Message", exact: true });
  await box.fill("Thank you, Ken!");
  await hana.keyboard.press("Enter");
  await expect(bubble(hana, "Thank you, Ken!")).toBeVisible();

  await go(ken, "/connections");
  await ken.locator('a[href^="/connections/chat/"]').first().click();
  await expect(bubble(ken, "Thank you, Ken!")).toBeVisible();
  await ken.getByRole("textbox", { name: "Message", exact: true }).fill("You're welcome!");
  await ken.keyboard.press("Enter");

  // react
  await expect(bubble(hana, "You're welcome!")).toBeVisible({ timeout: 20_000 });
  await bubble(hana, "You're welcome!").hover();
  await hana.getByRole("button", { name: "React", exact: true }).last().click();
  await hana.getByRole("menuitem", { name: "React ❤️" }).click();
  await expect(hana.getByRole("button", { name: /❤️/ }).first()).toBeVisible();
  // edit
  await bubble(hana, "Thank you, Ken!").hover();
  await hana.getByRole("button", { name: "Edit message" }).first().click();
  await box.fill("Thank you so much, Ken!");
  await hana.keyboard.press("Enter");
  await expect(bubble(hana, "Thank you so much, Ken!")).toBeVisible();
  await expect(hana.getByText(/Edited/).first()).toBeVisible();
  // delete
  await bubble(hana, "Thank you so much, Ken!").hover();
  await hana.getByRole("button", { name: "Delete message" }).first().click();
  await hana.getByRole("dialog").getByRole("button", { name: /^Delete$/ }).click();
  await expect(hana.getByText("You deleted this message")).toBeVisible();
  await expect(ken.getByText("This message was deleted")).toBeVisible({ timeout: 20_000 });
});

test("own profile shows the connections card", async () => {
  const me = await hana.locator('header a[href^="/profile/"]').first().getAttribute("href");
  await go(hana, me!);
  await expect(hana.getByText(/1\s*connection/).first()).toBeVisible();
});

test("the JA switch translates the UI and EN restores it", async () => {
  await go(hana, "/posts");
  await hana.getByRole("button", { name: /^JA$/ }).first().click();
  await expect(hana.locator("h1").first()).toHaveText(/投稿/);
  await hana.getByRole("button", { name: /^EN$/ }).first().click();
  await expect(hana.locator("h1").first()).toHaveText("Community Posts");
});

test("phone width: no page scrolls sideways", async () => {
  const phone = await hanaCtx.newPage();
  await phone.setViewportSize({ width: 375, height: 812 });
  const me = await hana.locator('header a[href^="/profile/"]').first().getAttribute("href");
  const overflowing: string[] = [];
  for (const path of ["/", "/posts", "/search", "/about", "/my-activity", "/requests", "/chat", "/connections", "/connections?tab=find", "/notifications", "/transactions", "/quick-post", "/posts/new", "/profile/edit", me!]) {
    await go(phone, path);
    await phone.waitForTimeout(800);
    const extra = await phone.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (extra > 1) overflowing.push(`${path} (+${extra}px)`);
  }
  await phone.close();
  expect(overflowing).toEqual([]);
});

test("no JavaScript errors happened anywhere", async () => {
  expect(pageErrors).toEqual([]);
});
