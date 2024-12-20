(function (f) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = f();
  } else if (typeof define === 'function' && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== 'undefined') {
      g = window;
    } else if (typeof global !== 'undefined') {
      g = global;
    } else if (typeof self !== 'undefined') {
      g = self;
    } else {
      g = this;
    }
    g.injected = f();
  }
})(function () {
  var define, module, exports;
  return (function () {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = 'function' == typeof require && require;
            if (!f && c) return c(i, !0);
            if (u) return u(i, !0);
            var a = new Error("Cannot find module '" + i + "'");
            throw ((a.code = 'MODULE_NOT_FOUND'), a);
          }
          var p = (n[i] = { exports: {} });
          e[i][0].call(
            p.exports,
            function (r) {
              var n = e[i][1][r];
              return o(n || r);
            },
            p,
            p.exports,
            r,
            e,
            n,
            t,
          );
        }
        return n[i].exports;
      }
      for (
        var u = 'function' == typeof require && require, i = 0;
        i < t.length;
        i++
      )
        o(t[i]);
      return o;
    }
    return r;
  })()(
    {
      1: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.AvailableCommands = void 0;
          var AvailableCommands;
          (function (AvailableCommands) {
            AvailableCommands['ProviderListAccounts'] = 'LIST_ACCOUNTS';
            AvailableCommands['ProviderDeleteAccount'] = 'DELETE_ACCOUNT';
            AvailableCommands['ProviderImportAccount'] = 'IMPORT_ACCOUNT';
            AvailableCommands['AccountBalance'] = 'ACCOUNT_BALANCE';
            AvailableCommands['AccountSign'] = 'ACCOUNT_SIGN';
            AvailableCommands['ProviderGenerateNewAccount'] =
              'GENERATE_NEW_ACCOUNT';
            AvailableCommands['AccountSellRolls'] = 'ACCOUNT_SELL_ROLLS';
            AvailableCommands['AccountBuyRolls'] = 'ACCOUNT_BUY_ROLLS';
            AvailableCommands['AccountSendTransaction'] =
              'ACCOUNT_SEND_TRANSACTION';
            AvailableCommands['ProviderGetNodesUrls'] = 'GET_NODES_URLS';
            AvailableCommands['AccountCallSC'] = 'ACCOUNT_CALL_SC';
          })(
            (AvailableCommands =
              exports.AvailableCommands || (exports.AvailableCommands = {})),
          );
        },
        {},
      ],
      2: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.registerAndInitProvider = exports.ContentScriptProvider =
            void 0;
          const Commands_1 = require('./Commands');
          const MASSA_WINDOW_OBJECT = 'massaWalletProvider';
          // =========================================================
          const detailWrapper = (detail) => {
            if (typeof cloneInto === 'function') {
              return cloneInto(detail, window);
            }
            return detail;
          };
          class ContentScriptProvider {
            constructor(providerName) {
              this.providerName = providerName;
              this.actionToCallback = new Map();
              this.attachCallbackHandler =
                this.attachCallbackHandler.bind(this);
              this.sign = this.sign.bind(this);
              this.balance = this.balance.bind(this);
              this.deleteAccount = this.deleteAccount.bind(this);
              this.importAccount = this.importAccount.bind(this);
              this.buyRolls = this.buyRolls.bind(this);
              this.sellRolls = this.sellRolls.bind(this);
              this.sendTransaction = this.sendTransaction.bind(this);
              this.listAccounts = this.listAccounts.bind(this);
              this.getNodesUrls = this.getNodesUrls.bind(this);
              this.callSC = this.callSC.bind(this);
              // this is the current provider html element
              const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${this.providerName}`;
              if (!document.getElementById(providerEventTargetName)) {
                const inv = document.createElement('p');
                inv.id = providerEventTargetName;
                document.body.appendChild(inv);
              }
              const walletProviderEventTarget =
                document.getElementById(MASSA_WINDOW_OBJECT);
              if (!walletProviderEventTarget) {
                throw new Error(`Wallet Provider Event Target html element with id ${MASSA_WINDOW_OBJECT} not created. 
      Make sure your "massa-wallet-provider" is already initialized`);
              }
              // ======================SIGN===============================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountSign,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountSign,
                    )(payload);
                  },
                );
              // attach handlers for various methods
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountSign,
                async (payload) => {
                  const accountSignPayload = payload.params;
                  const respMessage = {
                    result: await this.sign(accountSignPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new Event(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ===========================BALANCE============================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountBalance,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountBalance,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountBalance,
                async (payload) => {
                  const accountBalancePayload = payload.params;
                  const respMessage = {
                    result: await this.balance(accountBalancePayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ============================DELETE ACCOUNT============================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.ProviderDeleteAccount,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.ProviderDeleteAccount,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.ProviderDeleteAccount,
                async (payload) => {
                  const accountDeletionPayload = payload.params;
                  const respMessage = {
                    result: await this.deleteAccount(accountDeletionPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // =============================IMPORT ACCOUNT===================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.ProviderImportAccount,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.ProviderImportAccount,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.ProviderImportAccount,
                async (payload) => {
                  const accountImportPayload = payload.params;
                  const respMessage = {
                    result: await this.importAccount(accountImportPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================LIST ACCOUNTS==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.ProviderListAccounts,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.ProviderListAccounts,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.ProviderListAccounts,
                async (payload) => {
                  const respMessage = {
                    result: await this.listAccounts(),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================BUY ROLLS==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountBuyRolls,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountBuyRolls,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountBuyRolls,
                async (payload) => {
                  const rollOperationPayload = payload.params;
                  const respMessage = {
                    result: await this.buyRolls(rollOperationPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================SELL ROLLS==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountSellRolls,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountSellRolls,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountSellRolls,
                async (payload) => {
                  const rollOperationPayload = payload.params;
                  const respMessage = {
                    result: await this.sellRolls(rollOperationPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================SEND TRANSACTION==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountSendTransaction,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountSendTransaction,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountSendTransaction,
                async (payload) => {
                  const rollOperationPayload = payload.params;
                  const respMessage = {
                    result: await this.sendTransaction(rollOperationPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================CALL SC==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.AccountCallSC,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.AccountCallSC,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.AccountCallSC,
                async (payload) => {
                  const operationPayload = payload.params;
                  const respMessage = {
                    result: await this.callSC(operationPayload),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
              // ==============================GET NODES URLS==================================
              document
                .getElementById(providerEventTargetName)
                .addEventListener(
                  Commands_1.AvailableCommands.ProviderGetNodesUrls,
                  (evt) => {
                    const payload = evt.detail;
                    this.actionToCallback.get(
                      Commands_1.AvailableCommands.ProviderGetNodesUrls,
                    )(payload);
                  },
                );
              this.attachCallbackHandler(
                Commands_1.AvailableCommands.ProviderGetNodesUrls,
                async (payload) => {
                  const respMessage = {
                    result: await this.getNodesUrls(),
                    error: null,
                    requestId: payload.requestId,
                  };
                  // answer to the message target
                  walletProviderEventTarget.dispatchEvent(
                    new CustomEvent(
                      'message',
                      detailWrapper({ detail: respMessage }),
                    ),
                  );
                },
              );
            }
            // =======================================================================
            attachCallbackHandler(methodName, callback) {
              this.actionToCallback.set(methodName, callback);
            }
            static async registerAsMassaWalletProvider(providerName) {
              return withTimeoutRejection(
                new Promise((resolve) => {
                  const registerProvider = () => {
                    if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
                      return resolve(false);
                    }
                    // answer to the register target
                    const isRegisterEventSent = document
                      .getElementById(MASSA_WINDOW_OBJECT)
                      .dispatchEvent(
                        new CustomEvent(
                          'register',
                          detailWrapper({
                            detail: {
                              providerName: providerName,
                              eventTarget: providerName,
                            },
                          }),
                        ),
                      );
                    return resolve(isRegisterEventSent);
                  };
                  if (
                    document.readyState === 'complete' ||
                    document.readyState === 'interactive'
                  ) {
                    registerProvider();
                  } else {
                    document.addEventListener(
                      'DOMContentLoaded',
                      registerProvider,
                    );
                  }
                }),
                5000,
              );
            }
          }
          exports.ContentScriptProvider = ContentScriptProvider;
          async function withTimeoutRejection(promise, timeoutMs) {
            const sleep = new Promise((resolve, reject) =>
              setTimeout(
                () =>
                  reject(
                    new Error(
                      `Timeout of ${timeoutMs} has passed and promise did not resolve`,
                    ),
                  ),
                timeoutMs,
              ),
            );
            return Promise.race([promise, sleep]);
          }
          async function registerAndInitProvider(Clazz, providerName) {
            const isProviderRegistered =
              await ContentScriptProvider.registerAsMassaWalletProvider(
                providerName,
              );
            // create an instance of the extension for communication
            if (isProviderRegistered) {
              new Clazz(providerName);
            }
          }
          exports.registerAndInitProvider = registerAndInitProvider;
        },
        { './Commands': 1 },
      ],
      3: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.registerAndInitProvider = exports.ContentScriptProvider =
            void 0;
          var ContentScriptProvider_1 = require('./ContentScriptProvider');
          Object.defineProperty(exports, 'ContentScriptProvider', {
            enumerable: true,
            get: function () {
              return ContentScriptProvider_1.ContentScriptProvider;
            },
          });
          Object.defineProperty(exports, 'registerAndInitProvider', {
            enumerable: true,
            get: function () {
              return ContentScriptProvider_1.registerAndInitProvider;
            },
          });
        },
        { './ContentScriptProvider': 2 },
      ],
      4: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          const tslib_1 = require('tslib');
          tslib_1.__exportStar(require('./implementation'), exports);
          tslib_1.__exportStar(require('./interfaces'), exports);
          tslib_1.__exportStar(require('./operations'), exports);
        },
        {
          './implementation': 3,
          './interfaces': 5,
          './operations': 8,
          tslib: 9,
        },
      ],
      5: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
        },
        {},
      ],
      6: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.EAccountDeletionResponse = void 0;
          var EAccountDeletionResponse;
          (function (EAccountDeletionResponse) {
            EAccountDeletionResponse[(EAccountDeletionResponse['OK'] = 0)] =
              'OK';
            EAccountDeletionResponse[
              (EAccountDeletionResponse['REFUSED'] = 1)
            ] = 'REFUSED';
            EAccountDeletionResponse[(EAccountDeletionResponse['ERROR'] = 2)] =
              'ERROR';
          })(
            (EAccountDeletionResponse =
              exports.EAccountDeletionResponse ||
              (exports.EAccountDeletionResponse = {})),
          );
        },
        {},
      ],
      7: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.EAccountImportResponse = void 0;
          var EAccountImportResponse;
          (function (EAccountImportResponse) {
            EAccountImportResponse[(EAccountImportResponse['OK'] = 0)] = 'OK';
            EAccountImportResponse[(EAccountImportResponse['REFUSED'] = 1)] =
              'REFUSED';
            EAccountImportResponse[(EAccountImportResponse['ERROR'] = 2)] =
              'ERROR';
          })(
            (EAccountImportResponse =
              exports.EAccountImportResponse ||
              (exports.EAccountImportResponse = {})),
          );
        },
        {},
      ],
      8: [
        function (require, module, exports) {
          'use strict';
          Object.defineProperty(exports, '__esModule', { value: true });
          exports.EAccountImportResponse = exports.EAccountDeletionResponse =
            void 0;
          var AccountDeletion_1 = require('./AccountDeletion');
          Object.defineProperty(exports, 'EAccountDeletionResponse', {
            enumerable: true,
            get: function () {
              return AccountDeletion_1.EAccountDeletionResponse;
            },
          });
          var AccountImport_1 = require('./AccountImport');
          Object.defineProperty(exports, 'EAccountImportResponse', {
            enumerable: true,
            get: function () {
              return AccountImport_1.EAccountImportResponse;
            },
          });
        },
        { './AccountDeletion': 6, './AccountImport': 7 },
      ],
      9: [
        function (require, module, exports) {
          'use strict';

          Object.defineProperty(exports, '__esModule', {
            value: true,
          });
          exports.__addDisposableResource = __addDisposableResource;
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
          exports.__disposeResources = __disposeResources;
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
          exports.default = void 0;
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
          /* global Reflect, Promise, SuppressedError, Symbol */

          var extendStatics = function (d, b) {
            extendStatics =
              Object.setPrototypeOf ||
              ({
                __proto__: [],
              } instanceof Array &&
                function (d, b) {
                  d.__proto__ = b;
                }) ||
              function (d, b) {
                for (var p in b)
                  if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
              };
            return extendStatics(d, b);
          };
          function __extends(d, b) {
            if (typeof b !== 'function' && b !== null)
              throw new TypeError(
                'Class extends value ' +
                  String(b) +
                  ' is not a constructor or null',
              );
            extendStatics(d, b);
            function __() {
              this.constructor = d;
            }
            d.prototype =
              b === null
                ? Object.create(b)
                : ((__.prototype = b.prototype), new __());
          }
          var __assign = function () {
            exports.__assign = __assign =
              Object.assign ||
              function __assign(t) {
                for (var s, i = 1, n = arguments.length; i < n; i++) {
                  s = arguments[i];
                  for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
                }
                return t;
              };
            return __assign.apply(this, arguments);
          };
          exports.__assign = __assign;
          function __rest(s, e) {
            var t = {};
            for (var p in s)
              if (
                Object.prototype.hasOwnProperty.call(s, p) &&
                e.indexOf(p) < 0
              )
                t[p] = s[p];
            if (s != null && typeof Object.getOwnPropertySymbols === 'function')
              for (
                var i = 0, p = Object.getOwnPropertySymbols(s);
                i < p.length;
                i++
              ) {
                if (
                  e.indexOf(p[i]) < 0 &&
                  Object.prototype.propertyIsEnumerable.call(s, p[i])
                )
                  t[p[i]] = s[p[i]];
              }
            return t;
          }
          function __decorate(decorators, target, key, desc) {
            var c = arguments.length,
              r =
                c < 3
                  ? target
                  : desc === null
                  ? (desc = Object.getOwnPropertyDescriptor(target, key))
                  : desc,
              d;
            if (
              typeof Reflect === 'object' &&
              typeof Reflect.decorate === 'function'
            )
              r = Reflect.decorate(decorators, target, key, desc);
            else
              for (var i = decorators.length - 1; i >= 0; i--)
                if ((d = decorators[i]))
                  r =
                    (c < 3
                      ? d(r)
                      : c > 3
                      ? d(target, key, r)
                      : d(target, key)) || r;
            return c > 3 && r && Object.defineProperty(target, key, r), r;
          }
          function __param(paramIndex, decorator) {
            return function (target, key) {
              decorator(target, key, paramIndex);
            };
          }
          function __esDecorate(
            ctor,
            descriptorIn,
            decorators,
            contextIn,
            initializers,
            extraInitializers,
          ) {
            function accept(f) {
              if (f !== void 0 && typeof f !== 'function')
                throw new TypeError('Function expected');
              return f;
            }
            var kind = contextIn.kind,
              key =
                kind === 'getter' ? 'get' : kind === 'setter' ? 'set' : 'value';
            var target =
              !descriptorIn && ctor
                ? contextIn['static']
                  ? ctor
                  : ctor.prototype
                : null;
            var descriptor =
              descriptorIn ||
              (target
                ? Object.getOwnPropertyDescriptor(target, contextIn.name)
                : {});
            var _,
              done = false;
            for (var i = decorators.length - 1; i >= 0; i--) {
              var context = {};
              for (var p in contextIn)
                context[p] = p === 'access' ? {} : contextIn[p];
              for (var p in contextIn.access)
                context.access[p] = contextIn.access[p];
              context.addInitializer = function (f) {
                if (done)
                  throw new TypeError(
                    'Cannot add initializers after decoration has completed',
                  );
                extraInitializers.push(accept(f || null));
              };
              var result = (0, decorators[i])(
                kind === 'accessor'
                  ? {
                      get: descriptor.get,
                      set: descriptor.set,
                    }
                  : descriptor[key],
                context,
              );
              if (kind === 'accessor') {
                if (result === void 0) continue;
                if (result === null || typeof result !== 'object')
                  throw new TypeError('Object expected');
                if ((_ = accept(result.get))) descriptor.get = _;
                if ((_ = accept(result.set))) descriptor.set = _;
                if ((_ = accept(result.init))) initializers.unshift(_);
              } else if ((_ = accept(result))) {
                if (kind === 'field') initializers.unshift(_);
                else descriptor[key] = _;
              }
            }
            if (target)
              Object.defineProperty(target, contextIn.name, descriptor);
            done = true;
          }
          function __runInitializers(thisArg, initializers, value) {
            var useValue = arguments.length > 2;
            for (var i = 0; i < initializers.length; i++) {
              value = useValue
                ? initializers[i].call(thisArg, value)
                : initializers[i].call(thisArg);
            }
            return useValue ? value : void 0;
          }
          function __propKey(x) {
            return typeof x === 'symbol' ? x : ''.concat(x);
          }
          function __setFunctionName(f, name, prefix) {
            if (typeof name === 'symbol')
              name = name.description ? '['.concat(name.description, ']') : '';
            return Object.defineProperty(f, 'name', {
              configurable: true,
              value: prefix ? ''.concat(prefix, ' ', name) : name,
            });
          }
          function __metadata(metadataKey, metadataValue) {
            if (
              typeof Reflect === 'object' &&
              typeof Reflect.metadata === 'function'
            )
              return Reflect.metadata(metadataKey, metadataValue);
          }
          function __awaiter(thisArg, _arguments, P, generator) {
            function adopt(value) {
              return value instanceof P
                ? value
                : new P(function (resolve) {
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
                  step(generator['throw'](value));
                } catch (e) {
                  reject(e);
                }
              }
              function step(result) {
                result.done
                  ? resolve(result.value)
                  : adopt(result.value).then(fulfilled, rejected);
              }
              step(
                (generator = generator.apply(thisArg, _arguments || [])).next(),
              );
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
                ops: [],
              },
              f,
              y,
              t,
              g;
            return (
              (g = {
                next: verb(0),
                throw: verb(1),
                return: verb(2),
              }),
              typeof Symbol === 'function' &&
                (g[Symbol.iterator] = function () {
                  return this;
                }),
              g
            );
            function verb(n) {
              return function (v) {
                return step([n, v]);
              };
            }
            function step(op) {
              if (f) throw new TypeError('Generator is already executing.');
              while ((g && ((g = 0), op[0] && (_ = 0)), _))
                try {
                  if (
                    ((f = 1),
                    y &&
                      (t =
                        op[0] & 2
                          ? y['return']
                          : op[0]
                          ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                          : y.next) &&
                      !(t = t.call(y, op[1])).done)
                  )
                    return t;
                  if (((y = 0), t)) op = [op[0] & 2, t.value];
                  switch (op[0]) {
                    case 0:
                    case 1:
                      t = op;
                      break;
                    case 4:
                      _.label++;
                      return {
                        value: op[1],
                        done: false,
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
                      if (
                        !((t = _.trys),
                        (t = t.length > 0 && t[t.length - 1])) &&
                        (op[0] === 6 || op[0] === 2)
                      ) {
                        _ = 0;
                        continue;
                      }
                      if (
                        op[0] === 3 &&
                        (!t || (op[1] > t[0] && op[1] < t[3]))
                      ) {
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
                done: true,
              };
            }
          }
          var __createBinding = Object.create
            ? function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                var desc = Object.getOwnPropertyDescriptor(m, k);
                if (
                  !desc ||
                  ('get' in desc
                    ? !m.__esModule
                    : desc.writable || desc.configurable)
                ) {
                  desc = {
                    enumerable: true,
                    get: function () {
                      return m[k];
                    },
                  };
                }
                Object.defineProperty(o, k2, desc);
              }
            : function (o, m, k, k2) {
                if (k2 === undefined) k2 = k;
                o[k2] = m[k];
              };
          exports.__createBinding = __createBinding;
          function __exportStar(m, o) {
            for (var p in m)
              if (
                p !== 'default' &&
                !Object.prototype.hasOwnProperty.call(o, p)
              )
                __createBinding(o, m, p);
          }
          function __values(o) {
            var s = typeof Symbol === 'function' && Symbol.iterator,
              m = s && o[s],
              i = 0;
            if (m) return m.call(o);
            if (o && typeof o.length === 'number')
              return {
                next: function () {
                  if (o && i >= o.length) o = void 0;
                  return {
                    value: o && o[i++],
                    done: !o,
                  };
                },
              };
            throw new TypeError(
              s ? 'Object is not iterable.' : 'Symbol.iterator is not defined.',
            );
          }
          function __read(o, n) {
            var m = typeof Symbol === 'function' && o[Symbol.iterator];
            if (!m) return o;
            var i = m.call(o),
              r,
              ar = [],
              e;
            try {
              while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
            } catch (error) {
              e = {
                error: error,
              };
            } finally {
              try {
                if (r && !r.done && (m = i['return'])) m.call(i);
              } finally {
              if(e){
                throw `${e.error.message} at ${e.error.stack}`;
              }
              }
            }
            return ar;
          }

          /** @deprecated */
          function __spread() {
            for (var ar = [], i = 0; i < arguments.length; i++)
              ar = ar.concat(__read(arguments[i]));
            return ar;
          }

          /** @deprecated */
          function __spreadArrays() {
            for (var s = 0, i = 0, il = arguments.length; i < il; i++)
              s += arguments[i].length;
            for (var r = Array(s), k = 0, i = 0; i < il; i++)
              for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
            return r;
          }
          function __spreadArray(to, from, pack) {
            if (pack || arguments.length === 2)
              for (var i = 0, l = from.length, ar; i < l; i++) {
                if (ar || !(i in from)) {
                  if (!ar) ar = Array.prototype.slice.call(from, 0, i);
                  ar[i] = from[i];
                }
              }
            return to.concat(ar || Array.prototype.slice.call(from));
          }
          function __await(v) {
            return this instanceof __await
              ? ((this.v = v), this)
              : new __await(v);
          }
          function __asyncGenerator(thisArg, _arguments, generator) {
            if (!Symbol.asyncIterator)
              throw new TypeError('Symbol.asyncIterator is not defined.');
            var g = generator.apply(thisArg, _arguments || []),
              i,
              q = [];
            return (
              (i = {}),
              verb('next'),
              verb('throw'),
              verb('return'),
              (i[Symbol.asyncIterator] = function () {
                return this;
              }),
              i
            );
            function verb(n) {
              if (g[n])
                i[n] = function (v) {
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
              r.value instanceof __await
                ? Promise.resolve(r.value.v).then(fulfill, reject)
                : settle(q[0][2], r);
            }
            function fulfill(value) {
              resume('next', value);
            }
            function reject(value) {
              resume('throw', value);
            }
            function settle(f, v) {
              if ((f(v), q.shift(), q.length)) resume(q[0][0], q[0][1]);
            }
          }
          function __asyncDelegator(o) {
            var i, p;
            return (
              (i = {}),
              verb('next'),
              verb('throw', function (e) {
                throw e;
              }),
              verb('return'),
              (i[Symbol.iterator] = function () {
                return this;
              }),
              i
            );
            function verb(n, f) {
              i[n] = o[n]
                ? function (v) {
                    return (p = !p)
                      ? {
                          value: __await(o[n](v)),
                          done: false,
                        }
                      : f
                      ? f(v)
                      : v;
                  }
                : f;
            }
          }
          function __asyncValues(o) {
            if (!Symbol.asyncIterator)
              throw new TypeError('Symbol.asyncIterator is not defined.');
            var m = o[Symbol.asyncIterator],
              i;
            return m
              ? m.call(o)
              : ((o =
                  typeof __values === 'function'
                    ? __values(o)
                    : o[Symbol.iterator]()),
                (i = {}),
                verb('next'),
                verb('throw'),
                verb('return'),
                (i[Symbol.asyncIterator] = function () {
                  return this;
                }),
                i);
            function verb(n) {
              i[n] =
                o[n] &&
                function (v) {
                  return new Promise(function (resolve, reject) {
                    (v = o[n](v)), settle(resolve, reject, v.done, v.value);
                  });
                };
            }
            function settle(resolve, reject, d, v) {
              Promise.resolve(v).then(function (v) {
                resolve({
                  value: v,
                  done: d,
                });
              }, reject);
            }
          }
          function __makeTemplateObject(cooked, raw) {
            if (Object.defineProperty) {
              Object.defineProperty(cooked, 'raw', {
                value: raw,
              });
            } else {
              cooked.raw = raw;
            }
            return cooked;
          }
          var __setModuleDefault = Object.create
            ? function (o, v) {
                Object.defineProperty(o, 'default', {
                  enumerable: true,
                  value: v,
                });
              }
            : function (o, v) {
                o['default'] = v;
              };
          function __importStar(mod) {
            if (mod && mod.__esModule) return mod;
            var result = {};
            if (mod != null)
              for (var k in mod)
                if (
                  k !== 'default' &&
                  Object.prototype.hasOwnProperty.call(mod, k)
                )
                  __createBinding(result, mod, k);
            __setModuleDefault(result, mod);
            return result;
          }
          function __importDefault(mod) {
            return mod && mod.__esModule
              ? mod
              : {
                  default: mod,
                };
          }
          function __classPrivateFieldGet(receiver, state, kind, f) {
            if (kind === 'a' && !f)
              throw new TypeError(
                'Private accessor was defined without a getter',
              );
            if (
              typeof state === 'function'
                ? receiver !== state || !f
                : !state.has(receiver)
            )
              throw new TypeError(
                'Cannot read private member from an object whose class did not declare it',
              );
            return kind === 'm'
              ? f
              : kind === 'a'
              ? f.call(receiver)
              : f
              ? f.value
              : state.get(receiver);
          }
          function __classPrivateFieldSet(receiver, state, value, kind, f) {
            if (kind === 'm')
              throw new TypeError('Private method is not writable');
            if (kind === 'a' && !f)
              throw new TypeError(
                'Private accessor was defined without a setter',
              );
            if (
              typeof state === 'function'
                ? receiver !== state || !f
                : !state.has(receiver)
            )
              throw new TypeError(
                'Cannot write private member to an object whose class did not declare it',
              );
            return (
              kind === 'a'
                ? f.call(receiver, value)
                : f
                ? (f.value = value)
                : state.set(receiver, value),
              value
            );
          }
          function __classPrivateFieldIn(state, receiver) {
            if (
              receiver === null ||
              (typeof receiver !== 'object' && typeof receiver !== 'function')
            )
              throw new TypeError("Cannot use 'in' operator on non-object");
            return typeof state === 'function'
              ? receiver === state
              : state.has(receiver);
          }
          function __addDisposableResource(env, value, async) {
            if (value !== null && value !== void 0) {
              if (typeof value !== 'object' && typeof value !== 'function')
                throw new TypeError('Object expected.');
              var dispose;
              if (async) {
                if (!Symbol.asyncDispose)
                  throw new TypeError('Symbol.asyncDispose is not defined.');
                dispose = value[Symbol.asyncDispose];
              }
              if (dispose === void 0) {
                if (!Symbol.dispose)
                  throw new TypeError('Symbol.dispose is not defined.');
                dispose = value[Symbol.dispose];
              }
              if (typeof dispose !== 'function')
                throw new TypeError('Object not disposable.');
              env.stack.push({
                value: value,
                dispose: dispose,
                async: async,
              });
            } else if (async) {
              env.stack.push({
                async: true,
              });
            }
            return value;
          }
          var _SuppressedError =
            typeof SuppressedError === 'function'
              ? SuppressedError
              : function (error, suppressed, message) {
                  var e = new Error(message);
                  return (
                    (e.name = 'SuppressedError'),
                    (e.error = error),
                    (e.suppressed = suppressed),
                    e
                  );
                };
          function __disposeResources(env) {
            function fail(e) {
              env.error = env.hasError
                ? new _SuppressedError(
                    e,
                    env.error,
                    'An error was suppressed during disposal.',
                  )
                : e;
              env.hasError = true;
            }
            function next() {
              while (env.stack.length) {
                var rec = env.stack.pop();
                try {
                  var result = rec.dispose && rec.dispose.call(rec.value);
                  if (rec.async)
                    return Promise.resolve(result).then(next, function (e) {
                      fail(e);
                      return next();
                    });
                } catch (e) {
                  fail(e);
                }
              }
              if (env.hasError) throw env.error;
            }
            return next();
          }
          var _default = {
            __extends: __extends,
            __assign: __assign,
            __rest: __rest,
            __decorate: __decorate,
            __param: __param,
            __metadata: __metadata,
            __awaiter: __awaiter,
            __generator: __generator,
            __createBinding: __createBinding,
            __exportStar: __exportStar,
            __values: __values,
            __read: __read,
            __spread: __spread,
            __spreadArrays: __spreadArrays,
            __spreadArray: __spreadArray,
            __await: __await,
            __asyncGenerator: __asyncGenerator,
            __asyncDelegator: __asyncDelegator,
            __asyncValues: __asyncValues,
            __makeTemplateObject: __makeTemplateObject,
            __importStar: __importStar,
            __importDefault: __importDefault,
            __classPrivateFieldGet: __classPrivateFieldGet,
            __classPrivateFieldSet: __classPrivateFieldSet,
            __classPrivateFieldIn: __classPrivateFieldIn,
            __addDisposableResource: __addDisposableResource,
            __disposeResources: __disposeResources,
          };
          exports.default = _default;
        },
        {},
      ],
    },
    {},
    [4],
  )(4);
});
