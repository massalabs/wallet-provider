(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wallet = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const Connector_1 = require("../connector/Connector");
const __1 = require("..");
class Account {
    constructor({ address, name }, providerName) {
        this._address = address;
        this._name = name;
        this._providerName = providerName;
    }
    address() {
        return this._address;
    }
    name() {
        return this._name;
    }
    providerName() {
        return this._providerName;
    }
    async balance() {
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this._providerName, __1.AvailableCommands.AccountBalance, { address: this._address }, (result, err) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
    async sign(data) {
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this._providerName, __1.AvailableCommands.AccountSign, { address: this._address, data }, (result, err) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
}
exports.Account = Account;

},{"..":3,"../connector/Connector":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connector = void 0;
const uid_1 = require("uid");
const __1 = require("..");
const MASSA_WINDOW_OBJECT = 'massaWalletProvider';
class Connector {
    constructor() {
        this.registeredProviders = {};
        this.pendingRequests = new Map();
        this.register();
        // start listening to messages from content script
        document
            .getElementById(MASSA_WINDOW_OBJECT)
            .addEventListener('message', this.handleResponseFromContentScript.bind(this));
    }
    register() {
        // global event target to use for all wallet provider
        if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
            const inv = document.createElement('p');
            inv.id = MASSA_WINDOW_OBJECT;
            inv.setAttribute('style', 'display:none');
            document.body.appendChild(inv);
        }
        // add an invisible HTML element and set a listener to it like the following
        // hook up register handler
        document
            .getElementById(MASSA_WINDOW_OBJECT)
            .addEventListener('register', (evt) => {
            const payload = evt.detail;
            const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${payload.providerName}`;
            this.registeredProviders[payload.providerName] =
                providerEventTargetName;
        });
    }
    // send a message from the webpage script to the content script
    sendMessageToContentScript(providerName, command, params, responseCallback) {
        const requestId = (0, uid_1.uid)();
        const eventMessageRequest = {
            params,
            requestId,
        };
        this.pendingRequests.set(requestId, responseCallback);
        if (!Object.values(__1.AvailableCommands).includes(command)) {
            throw new Error(`Unknown command ${command}`);
        }
        // dispatch an event to the specific provider event target
        const specificProviderEventTarget = document.getElementById(`${this.registeredProviders[providerName]}`);
        if (!specificProviderEventTarget) {
            throw new Error(`Registered provider with name ${providerName} does not exist`);
        }
        const isDispatched = specificProviderEventTarget.dispatchEvent(new CustomEvent(command, { detail: eventMessageRequest }));
        if (!isDispatched) {
            throw new Error(`Could not dispatch a message to ${this.registeredProviders[providerName]}`);
        }
    }
    getWalletProviders() {
        return this.registeredProviders;
    }
    // receive a response from the content script
    handleResponseFromContentScript(event) {
        const { result, error, requestId } = event.detail;
        const responseCallback = this.pendingRequests.get(requestId);
        if (responseCallback) {
            if (error) {
                responseCallback(null, new Error(error.message));
            }
            else {
                responseCallback(result, null);
            }
            const deleted = this.pendingRequests.delete(requestId);
            if (!deleted) {
                console.error(`Error deleting a pending request with id ${requestId}`);
            }
        }
        else {
            console.error(`Request Id ${requestId} not found in response callback map`);
        }
    }
}
exports.connector = new Connector();

},{"..":3,"uid":8}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountImportResponse = exports.EAccountDeletionResponse = exports.providers = exports.AvailableCommands = void 0;
const Connector_1 = require("./connector/Connector");
const Provider_1 = require("./provider/Provider");
var AvailableCommands;
(function (AvailableCommands) {
    AvailableCommands["ProviderListAccounts"] = "LIST_ACCOUNTS";
    AvailableCommands["ProviderDeleteAccount"] = "DELETE_ACCOUNT";
    AvailableCommands["ProviderImportAccount"] = "IMPORT_ACCOUNT";
    AvailableCommands["AccountBalance"] = "ACCOUNT_BALANCE";
    AvailableCommands["AccountSign"] = "ACCOUNT_SIGN";
})(AvailableCommands = exports.AvailableCommands || (exports.AvailableCommands = {}));
function providers() {
    let providers = [];
    for (const providerName of Object.keys(Connector_1.connector.getWalletProviders())) {
        const p = new Provider_1.Provider(providerName);
        providers.push(p);
    }
    return providers;
}
exports.providers = providers;
var provider_1 = require("./provider");
Object.defineProperty(exports, "EAccountDeletionResponse", { enumerable: true, get: function () { return provider_1.EAccountDeletionResponse; } });
Object.defineProperty(exports, "EAccountImportResponse", { enumerable: true, get: function () { return provider_1.EAccountImportResponse; } });

},{"./connector/Connector":2,"./provider":7,"./provider/Provider":6}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountDeletionResponse = void 0;
var EAccountDeletionResponse;
(function (EAccountDeletionResponse) {
    EAccountDeletionResponse[EAccountDeletionResponse["OK"] = 0] = "OK";
    EAccountDeletionResponse[EAccountDeletionResponse["REFUSED"] = 1] = "REFUSED";
    EAccountDeletionResponse[EAccountDeletionResponse["ERROR"] = 2] = "ERROR";
})(EAccountDeletionResponse = exports.EAccountDeletionResponse || (exports.EAccountDeletionResponse = {}));

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountImportResponse = void 0;
var EAccountImportResponse;
(function (EAccountImportResponse) {
    EAccountImportResponse[EAccountImportResponse["OK"] = 0] = "OK";
    EAccountImportResponse[EAccountImportResponse["REFUSED"] = 1] = "REFUSED";
    EAccountImportResponse[EAccountImportResponse["ERROR"] = 2] = "ERROR";
})(EAccountImportResponse = exports.EAccountImportResponse || (exports.EAccountImportResponse = {}));

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const Connector_1 = require("../connector/Connector");
const Account_1 = require("../account/Account");
const __1 = require("..");
class Provider {
    constructor(providerName) {
        this.providerName = providerName;
    }
    name() {
        return this.providerName;
    }
    async accounts() {
        const providersPromise = new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, __1.AvailableCommands.ProviderListAccounts, {}, (result, err) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
        const providerAccounts = await providersPromise;
        let accounts = [];
        for (const providerAccount of providerAccounts) {
            const accInstance = new Account_1.Account(providerAccount, this.providerName);
            accounts.push(accInstance);
        }
        return accounts;
    }
    async importAccount(publicKey, privateKey) {
        const accountImportRequest = {
            publicKey,
            privateKey,
        };
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, __1.AvailableCommands.ProviderImportAccount, accountImportRequest, (result, err) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
    async deleteAccount(address) {
        const accountDeletionRequest = { address };
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, __1.AvailableCommands.ProviderDeleteAccount, accountDeletionRequest, (result, err) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
}
exports.Provider = Provider;

},{"..":3,"../account/Account":1,"../connector/Connector":2}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.EAccountImportResponse = exports.EAccountDeletionResponse = void 0;
var AccountDeletion_1 = require("./AccountDeletion");
Object.defineProperty(exports, "EAccountDeletionResponse", { enumerable: true, get: function () { return AccountDeletion_1.EAccountDeletionResponse; } });
var AccountImport_1 = require("./AccountImport");
Object.defineProperty(exports, "EAccountImportResponse", { enumerable: true, get: function () { return AccountImport_1.EAccountImportResponse; } });
var Provider_1 = require("./Provider");
Object.defineProperty(exports, "Provider", { enumerable: true, get: function () { return Provider_1.Provider; } });

},{"./AccountDeletion":4,"./AccountImport":5,"./Provider":6}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.uid = uid;
var IDX = 256,
  HEX = [],
  SIZE = 256,
  BUFFER;
while (IDX--) HEX[IDX] = (IDX + 256).toString(16).substring(1);
function uid(len) {
  var i = 0,
    tmp = len || 11;
  if (!BUFFER || IDX + tmp > SIZE * 2) {
    for (BUFFER = '', IDX = 0; i < SIZE; i++) {
      BUFFER += HEX[Math.random() * 256 | 0];
    }
  }
  return BUFFER.substring(IDX, IDX++ + tmp);
}

},{}]},{},[3])(3)
});
