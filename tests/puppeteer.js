const path = require('path');

const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();

	page.on('console', msg => console[typeof console[msg.type()] == 'function' ? msg.type() : 'log'](msg.text()));
	page.on('error', e => console.error(e));

	await page.exposeFunction('callPhantom', async text => {
		await browser.close();
		switch (text) {
			case "success":
				process.exit(0);
				break;
			case "failure":
				process.exit(1);
				break;
		}
		});

	await page.goto('file://' + path.join(__dirname, 'tests.html'));
})();
