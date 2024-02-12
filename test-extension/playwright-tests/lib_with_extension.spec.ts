import {
  test as base,
  expect,
  firefox,
  chromium,
  BrowserContext,
} from '@playwright/test';
import path from 'path';
import { loadFirefoxAddon } from './install_ff_addons';

const extensionPath = path.join(
  __dirname,
  '..',
  'simple-browser-extension',
  'plugin',
);

const createFirefoxContext = async () => {
  const browser = await firefox.launch({
    headless: true,
    args: ['-start-debugger-server', '6000'],
    firefoxUserPrefs: {
      'devtools.debugger.remote-enabled': true,
      'devtools.debugger.prompt-connection': false,
      'devtools.chrome.enabled': true,
      'devtools.debugger.remote-port': '6000',
    },
  });

  loadFirefoxAddon(6000, 'localhost', extensionPath);
  return browser.newContext();
};

const createChromiumContext = async () => {
  return chromium.launchPersistentContext('', {
    headless: true,
    args: [
      `--headless=new`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });
};

const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({ browserName }, use) => {
    let context: BrowserContext;

    if (browserName === 'firefox') {
      context = await createFirefoxContext();
    } else if (browserName === 'chromium') {
      context = await createChromiumContext();
    } else {
      throw new Error('Unsupported browser');
    }

    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [background] = context.backgroundPages();
    if (!background) {
      background = await context.waitForEvent('backgroundpage');
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

export const expec = test.expect;

test.describe.parallel('Browser Extension Testing', () => {
  test('test list content', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('ul > li')).toContainText([
      'SPACE_X',
      '0x0',
      '1234.5',
      '500.0',
      '0x0000',
      'http://localhost:1234,https://massa-nodes.net',
      'ABC',
      'XYZ',
      'MNP',
      'RST',
    ]);
  });
});
