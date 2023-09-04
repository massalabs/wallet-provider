const WALLET_PROVIDER_NAME = 'SPACE_X';
(async function () {
  // Make sure script is loaded once
  if (window.hasRun) return;
  window.hasRun = true;

  let mybrowser = chrome;

  // ==================== EXTENSION CONTENT-SCRIPT LOGIC =====================
  class WalletContentScriptProvider extends window.injected
    .ContentScriptProvider {
    // own members and functionalities for convenience
    constructor(providerName) {
      super(providerName);
    }

    async sign(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'sign', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async balance(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'balance', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async deleteAccount(payload) {
      return {
        response: window.injected.EAccountDeletionResponse.OK,
      };
    }
    async importAccount(payload) {
      return {
        response: window.injected.EAccountImportResponse.OK,
        message: 'Account successfully imported',
      };
    }
    async generateNewAccount(payload) {
      return {
        name: 'new-account',
        address: '0x1234',
      };
    }
    async listAccounts(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'listAccounts', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async getNodesUrls(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'getNodesUrls', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async buyRolls(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'buyRolls', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async sellRolls(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'sellRolls', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async sendTransaction(payload) {
      return new Promise((resolve, reject) => {
        // send a message to background.js and await its response
        mybrowser.runtime.sendMessage(
          { action: 'sendTransaction', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
    async callSC(payload) {
      // send a message to background.js and await its response
      return new Promise((resolve, reject) => {
        mybrowser.runtime.sendMessage(
          { action: 'callSC', params: payload },
          (response) => {
            return resolve(response);
          },
        );
      });
    }
  }

  // ==================== REGISTRATION =====================
  await window.injected.registerAndInitProvider(
    WalletContentScriptProvider,
    WALLET_PROVIDER_NAME,
  );
})();
