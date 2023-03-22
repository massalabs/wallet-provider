

(function() {

  /**
   * Check and set a global guard variable.
   * If this content script is injected into the same page again,
   * it will do nothing next time.
   */
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  console.log("Hello from wallet provider content script", );

  // BELOW IS THE JS LIB CODE (WALLET_PROVIDER-CONTENT-SCRIPT) WHICH THE EXTENSION WILL USE IN ITS MANIFEST TO REGISTER ITSELF (THE LATTER MAYBE IN ITS BACKGROUND CODE)
  // BACKGROUND CODE calls ---> CONTENT SCRIPT (which registers the wallet provider under window.massaWalletProvider by calling registerAsMassaWalletProvider)
  // CONTENT CODE (dapp developer) calls BACKGROUND CODE (the actual extension impl) and listens to response from that to resolve the promise in teh dapp

  /*
  interface RegistrationPayload {
    providerName: string;
    eventTarget: string;
  }
  
  function registerAsMassaWalletProvider(providerName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const registerProvider = () => {
        window.massaWalletProvider.dispatchEvent(
          new CustomEvent('register', {
            detail: { providerName: providerName, eventTarget: providerName } as RegistrationPayload
          })
        );
        resolve(true);
      };
  
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        registerProvider();
      } else {
        document.addEventListener('DOMContentLoaded', registerProvider);
      }
    });
  }
  
  const actionToCallback = new Map<string, Function>()
  
  function sign(callback: Function): void {
    actionToCallback.set('sign', callback);
  }
  
  // and how the content script listen for commands
  window[`massaWalletProvider-${eventTarget}`].addEventListener('sign', payload => {
    actionToCallback.get('sign')(...payload.detail.params);
  })
  */

  
})();
  