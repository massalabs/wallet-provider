let IS_CHROME = /Chrome/.test(navigator.userAgent);
let mybrowser = chrome;

// THIS IS THE INTERNAL WALLET FUNCTIONALITY (CONTROLLERS, STORAGE ETC.)
class MassaSpaceWalletImpl {
  constructor(name) {
    this.name = name;
  }

  // Wrapper function to handle Chrome or Firefox messaging system
  async onMessage(request, sender, sendResponse) {
    let res;
    try {
      res = await this._onMessage(request, sender);
    } catch (e) {
      console.log(e);
      res = { error: e.toString() };
    }
    if (IS_CHROME) sendResponse(res);
    else return res;
  }

  async _onMessage(request, sender, sendResponse) {
    let fromExtension = false;
    if (IS_CHROME)
      fromExtension =
        sender.origin === 'chrome-extension://' + chrome.runtime.id;
    else
      fromExtension =
        sender.envType === 'addon_child' && sender.id === browser.runtime.id;

    if (request.action === 'balance') {
      return { finalBalance: '1234.5', candidateBalance: '500.0' };
    } else if (request.action === 'sign') {
      return {
        publicKey: '0x0000',
        signature: Uint8Array.from([1, 2, 3]),
      };
    } else if (request.action === 'listAccounts') {
      return [{ name: 'my account', address: '0x0' }];
    } else if (request.action === 'getNodesUrls') {
      return ['http://localhost:1234', 'https://massa-nodes.net'];
    } else if (request.action === 'buyRolls') {
      return {
        operationId: 'ABC',
      };
    } else if (request.action === 'sellRolls') {
      return {
        operationId: 'XYZ',
      };
    } else if (request.action === 'sendTransaction') {
      return {
        operationId: 'MNP',
      };
    } else if (request.action === 'callSC') {
      return {
        operationId: 'RST',
      };
    } else {
      return undefined;
    }
  }
}

// initialize the wallet implementation in the background script
const massaSpaceWallet = new MassaSpaceWalletImpl('MassaSpaceWallet');

// start listening for messages from the content_script to handle
if (IS_CHROME) {
  mybrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[BACKGROUND_JS (CHROME)] Received request to handle...');
    massaSpaceWallet.onMessage(request, sender, sendResponse);
    return true; // need to return true to allow async
  });
} else {
  mybrowser.runtime.onMessage.addListener(
    async (request, sender, sendResponse) => {
      console.log('[BACKGROUND_JS (NOT CHROME)] Received request to handle...');
      return massaSpaceWallet.onMessage(request, sender, sendResponse);
    },
  );
}
