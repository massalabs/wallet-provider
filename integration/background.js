let IS_CHROME = /Chrome/.test(navigator.userAgent);
let mybrowser = IS_CHROME ? chrome : browser;

// THIS IS THE INTERNAL WALLET FUNCTIONALITY (AS ANTOINES CASE: MAYBE IT LOADS WEB3 VIA PAGE, CREATES CONTROLLER ETC.)

if (IS_CHROME) {
  console.log('Browser is chrome');
  /*
    mybrowser.runtime.onMessage.addListener((request, sender, sendResponse) => 
    {
        console.log("Data", request, sender, sendResponse);
    });
    */
} else {
  console.log('Browser is not chrome');
  /*
    mybrowser.runtime.onMessage.addListener(async (request, sender, sendResponse) => 
    {
        console.log("Data", request, sender, sendResponse);   
    });
    */
}
