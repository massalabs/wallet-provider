const IS_CHROME = /Chrome/.test(navigator.userAgent);
const mybrowser = IS_CHROME ? chrome : browser;


const checkBalance = () => {
  console.log("Checking balance...");
    mybrowser.runtime.sendMessage({action: "getBalance"}, (res) => {
      var myButton = document.getElementById("myButton");
      myButton.textContent = `Balance = ${res.balance}`;
    });
}

document.addEventListener("DOMContentLoaded", function() {
  var myButton = document.getElementById("myButton");
  myButton.addEventListener("click", checkBalance);
});