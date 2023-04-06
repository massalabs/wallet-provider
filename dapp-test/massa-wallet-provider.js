(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.wallet = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const Connector_1 = require("./Connector");
const Commands_1 = require("./Commands");
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
            Connector_1.connector.sendMessageToContentScript(this._providerName, Commands_1.AvailableCommands.AccountBalance, { address: this._address }, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
    async sign(data) {
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this._providerName, Commands_1.AvailableCommands.AccountSign, { address: this._address, data }, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
}
exports.Account = Account;

},{"./Commands":2,"./Connector":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailableCommands = void 0;
var AvailableCommands;
(function (AvailableCommands) {
    AvailableCommands["ProviderListAccounts"] = "LIST_ACCOUNTS";
    AvailableCommands["ProviderDeleteAccount"] = "DELETE_ACCOUNT";
    AvailableCommands["ProviderImportAccount"] = "IMPORT_ACCOUNT";
    AvailableCommands["AccountBalance"] = "ACCOUNT_BALANCE";
    AvailableCommands["AccountSign"] = "ACCOUNT_SIGN";
})(AvailableCommands = exports.AvailableCommands || (exports.AvailableCommands = {}));

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connector = void 0;
const uid_1 = require("uid");
const Commands_1 = require("./Commands");
const MASSA_WINDOW_OBJECT = 'massaWalletProvider';
// =========================================================
class Connector {
    constructor() {
        this.registeredProviders = {};
        this.pendingRequests = new Map();
        this.register();
        // start listening to messages from content script
        document
            .getElementById(MASSA_WINDOW_OBJECT)
            .addEventListener('message', this.handleResponseFromContentScript);
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
        if (!Object.values(Commands_1.AvailableCommands).includes(command)) {
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
                responseCallback(new Error(error.message), null);
            }
            else {
                responseCallback(null, result);
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

},{"./Commands":2,"uid":12}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = void 0;
const Connector_1 = require("./Connector");
const Account_1 = require("./Account");
const Commands_1 = require("./Commands");
class Provider {
    constructor(providerName) {
        this.providerName = providerName;
    }
    name() {
        return this.providerName;
    }
    async accounts() {
        const providersPromise = new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, Commands_1.AvailableCommands.ProviderListAccounts, {}, (err, result) => {
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
    async importAccount(accountImportRequest) {
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, Commands_1.AvailableCommands.ProviderImportAccount, { ...accountImportRequest }, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
    async deleteAccount(accountDeletionRequest) {
        return new Promise((resolve, reject) => {
            Connector_1.connector.sendMessageToContentScript(this.providerName, Commands_1.AvailableCommands.ProviderDeleteAccount, { ...accountDeletionRequest }, (err, result) => {
                if (err)
                    return reject(err);
                return resolve(result);
            });
        });
    }
}
exports.Provider = Provider;

},{"./Account":1,"./Commands":2,"./Connector":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Provider = exports.Account = exports.providers = void 0;
const Connector_1 = require("./Connector");
const Provider_1 = require("./Provider");
function providers() {
    let providers = [];
    for (const providerName of Object.keys(Connector_1.connector.getWalletProviders())) {
        const p = new Provider_1.Provider(providerName);
        providers.push(p);
    }
    return providers;
}
exports.providers = providers;
var Account_1 = require("./Account");
Object.defineProperty(exports, "Account", { enumerable: true, get: function () { return Account_1.Account; } });
var Provider_2 = require("./Provider");
Object.defineProperty(exports, "Provider", { enumerable: true, get: function () { return Provider_2.Provider; } });

},{"./Account":1,"./Connector":3,"./Provider":4}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./implementation"), exports);
tslib_1.__exportStar(require("./interfaces"), exports);
tslib_1.__exportStar(require("./operations"), exports);

},{"./implementation":5,"./interfaces":7,"./operations":10,"tslib":11}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountDeletionResponse = void 0;
var EAccountDeletionResponse;
(function (EAccountDeletionResponse) {
    EAccountDeletionResponse[EAccountDeletionResponse["OK"] = 0] = "OK";
    EAccountDeletionResponse[EAccountDeletionResponse["REFUSED"] = 1] = "REFUSED";
    EAccountDeletionResponse[EAccountDeletionResponse["ERROR"] = 2] = "ERROR";
})(EAccountDeletionResponse = exports.EAccountDeletionResponse || (exports.EAccountDeletionResponse = {}));

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountImportResponse = void 0;
var EAccountImportResponse;
(function (EAccountImportResponse) {
    EAccountImportResponse[EAccountImportResponse["OK"] = 0] = "OK";
    EAccountImportResponse[EAccountImportResponse["REFUSED"] = 1] = "REFUSED";
    EAccountImportResponse[EAccountImportResponse["ERROR"] = 2] = "ERROR";
})(EAccountImportResponse = exports.EAccountImportResponse || (exports.EAccountImportResponse = {}));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EAccountImportResponse = exports.EAccountDeletionResponse = void 0;
var AccountDeletion_1 = require("./AccountDeletion");
Object.defineProperty(exports, "EAccountDeletionResponse", { enumerable: true, get: function () { return AccountDeletion_1.EAccountDeletionResponse; } });
var AccountImport_1 = require("./AccountImport");
Object.defineProperty(exports, "EAccountImportResponse", { enumerable: true, get: function () { return AccountImport_1.EAccountImportResponse; } });

},{"./AccountDeletion":8,"./AccountImport":9}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.__assign = void 0;
exports.__asyncDelegator = __asyncDelegator;
exports.__asyncGenerator = __asyncGenerator;
exports.__asyncValues = __asyncValues;
exports.__await = __await;
exports.__awaiter = __awaiter;
exports.__classPrivateFieldGet = __classPrivateFieldGet;
exports.__classPrivateFieldIn = __classPrivateFieldIn;
exports.__classPrivateFieldSet = __classPrivateFieldSet;
exports.__createBinding = void 0;
exports.__decorate = __decorate;
exports.__esDecorate = __esDecorate;
exports.__exportStar = __exportStar;
exports.__extends = __extends;
exports.__generator = __generator;
exports.__importDefault = __importDefault;
exports.__importStar = __importStar;
exports.__makeTemplateObject = __makeTemplateObject;
exports.__metadata = __metadata;
exports.__param = __param;
exports.__propKey = __propKey;
exports.__read = __read;
exports.__rest = __rest;
exports.__runInitializers = __runInitializers;
exports.__setFunctionName = __setFunctionName;
exports.__spread = __spread;
exports.__spreadArray = __spreadArray;
exports.__spreadArrays = __spreadArrays;
exports.__values = __values;
/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function (d, b) {
  extendStatics = Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var __assign = function () {
  exports.__assign = __assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
exports.__assign = __assign;
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind,
    key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _,
    done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function (f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? {
      get: descriptor.get,
      set: descriptor.set
    } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || typeof result !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.push(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.push(_);else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
}
;
function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
}
;
function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
}
;
function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", {
    configurable: true,
    value: prefix ? "".concat(prefix, " ", name) : name
  });
}
;
function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = {
      label: 0,
      sent: function () {
        if (t[0] & 1) throw t[1];
        return t[1];
      },
      trys: [],
      ops: []
    },
    f,
    y,
    t,
    g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;
  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (g && (g = 0, op[0] && (_ = 0)), _) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return {
            value: op[1],
            done: false
          };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
var __createBinding = Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function () {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
};
exports.__createBinding = __createBinding;
function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
    m = s && o[s],
    i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function () {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
    r,
    ar = [],
    e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}

/** @deprecated */
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
  return ar;
}

/** @deprecated */
function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];
  return r;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []),
    i,
    q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
    return this;
  }, i;
  function verb(n) {
    if (g[n]) i[n] = function (v) {
      return new Promise(function (a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }
  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }
  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }
  function fulfill(value) {
    resume("next", value);
  }
  function reject(value) {
    resume("throw", value);
  }
  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function () {
    return this;
  }, i;
  function verb(n, f) {
    i[n] = o[n] ? function (v) {
      return (p = !p) ? {
        value: __await(o[n](v)),
        done: false
      } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator],
    i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
    return this;
  }, i);
  function verb(n) {
    i[n] = o[n] && function (v) {
      return new Promise(function (resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }
  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function (v) {
      resolve({
        value: v,
        done: d
      });
    }, reject);
  }
}
function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", {
      value: raw
    });
  } else {
    cooked.raw = raw;
  }
  return cooked;
}
;
var __setModuleDefault = Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
};
function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}
function __importDefault(mod) {
  return mod && mod.__esModule ? mod : {
    default: mod
  };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}
function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || typeof receiver !== "object" && typeof receiver !== "function") throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

},{}],12:[function(require,module,exports){
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

},{}]},{},[6])(6)
});
