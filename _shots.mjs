import { chromium } from 'playwright';

const base = 'http://localhost:5173';
const dir = process.env.SHOT_DIR;
const email = `shot${Date.now()}@example.com`;

const browser = await chromium.launch();

async function shoot(label, height, fn) {
	const ctx = await browser.newContext({
		viewport: { width: 390, height },
		deviceScaleFactor: 2,
		isMobile: true,
		hasTouch: true
	});
	const page = await ctx.newPage();
	await fn(page);
	await ctx.close();
}

// Sign up once (tall viewport) and capture dashboard states
await shoot('main', 844, async (page) => {
	await page.goto(`${base}/login?mode=signup`, { waitUntil: 'networkidle' });
	await page.fill('input[name=name]', 'Sam Carter');
	await page.fill('input[name=email]', email);
	await page.fill('input[name=password]', 'supersecret8');
	await page.click('.lg-submit');
	await page.waitForURL('**/app', { timeout: 20000 });

	// Give the account a little data so the dashboard isn't empty
	await page.click('.ft-action-income');
	await page.waitForSelector('.ft-drawer');
	await page.fill('.ft-amount-input input', '3200');
	await page.click('.ft-drawer-foot button[type=submit]');
	await page.waitForTimeout(800);
	await page.click('.ft-action-expense');
	await page.waitForSelector('.ft-drawer');
	await page.fill('.ft-amount-input input', '54.20');
	await page.click('.ft-drawer-foot button[type=submit]');
	await page.waitForTimeout(800);

	await page.screenshot({ path: `${dir}/m-dashboard.png`, fullPage: true });

	// Income drawer (viewport shot to reveal any cut-off footer)
	await page.click('.ft-action-income');
	await page.waitForSelector('.ft-drawer');
	await page.screenshot({ path: `${dir}/m-income-drawer.png` });
	await page.keyboard.press('Escape');

	// Expense drawer (8 categories -> tallest)
	await page.click('.ft-action-expense');
	await page.waitForSelector('.ft-drawer');
	await page.screenshot({ path: `${dir}/m-expense-drawer.png` });
	await page.keyboard.press('Escape');

	// Edit net worth drawer
	await page.click('.ft-nw-edit');
	await page.waitForSelector('.ft-drawer');
	await page.screenshot({ path: `${dir}/m-editnw-drawer.png` });
	await page.keyboard.press('Escape');
});

// Short viewport simulates the on-screen keyboard shrinking the visual viewport
await shoot('short', 460, async (page) => {
	await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
	await page.fill('input[name=email]', email);
	await page.fill('input[name=password]', 'supersecret8');
	await page.click('.lg-submit');
	await page.waitForURL('**/app', { timeout: 20000 });
	await page.click('.ft-action-expense');
	await page.waitForSelector('.ft-drawer');
	await page.screenshot({ path: `${dir}/m-expense-drawer-short.png` });
});

await browser.close();
console.log('shots done for', email);
