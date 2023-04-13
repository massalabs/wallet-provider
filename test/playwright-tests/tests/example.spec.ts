import { test as base, expect, firefox, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { loadFirefoxAddon } from './install_ff_addons';


const RDP_PORT = 6000;

(async () => {
  const browser = await firefox.launch({
    headless: true,
    args: [ '-start-debugger-server', String(RDP_PORT) ],
    firefoxUserPrefs: {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
      'devtools.chrome.enabled': true,
      'devtools.debugger.remote-port': String(RDP_PORT),
    }
  });

  loadFirefoxAddon(RDP_PORT, 'localhost', path.join(__dirname, '..', '..', 'simple-browser-extension', 'plugin') );

  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:9009/');

})();

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '..', '..', 'simple-browser-extension', 'plugin');
    
    const context = await firefox.launchPersistentContext('', {
      headless: true,
      args: [
        `--headless=new`, // the new headless arg for chrome v109+. Use '--headless=chrome' as arg for browsers v94-108.
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    
    // for manifest v2:
    let [background] = context.backgroundPages()
    if (!background)
      background = await context.waitForEvent('backgroundpage')

    // // for manifest v3:
    // let [background] = context.serviceWorkers();
    // if (!background)
    //   background = await context.waitForEvent('serviceworker');

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expec = test.expect;


test('sanity test' , async ({context}) => {
  const page = await context.newPage();
  await page.goto('https://google.com');
});

// Account.ts test
test('test account', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:9009/`);
  await expect(page.locator('ul > li')).toContainText(['SPACE_X', '0x0', '1234.5', '0x0000']);
});

