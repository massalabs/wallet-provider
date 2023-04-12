import { test as base, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';


export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '..', 'massa-wallet-provider-content-script', 'plugin');
    
    const context = await chromium.launchPersistentContext('', {
      headless: false,
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


// Account.ts test
test('test account', async ({ context }) => {
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:9009/`);
  await expect(page.locator('ul > li')).toContainText(['SPACE_X', '0x0', '1234.5', '0x0000']);
});

