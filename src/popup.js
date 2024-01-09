'use strict';

import './popup.css';

(function () {

  function setupCounter() {
    document.getElementById('slider-off')?.addEventListener('click', () => {
      // turn on focus mode
      chrome.storage.local.set({ focusMode: false }).then(() => {
        console.log('Value is set to false');
      });
    });

    document.getElementById('slider-on')?.addEventListener('click', () => {
      // turn on focus mode
      chrome.storage.local.set({ focusMode: true }).then(() => {
        console.log('Value is set to true');
      });
    });
  }



  function restoreCounter() {
    chrome.storage.local.get(['focusMode'], function (result) {
      console.log('Value currently is ' + result.focusMode);
      if (result.focusMode === true) {
        document.getElementById('toggle').checked = true;
      } else {
        document.getElementById('toggle').checked = false;
      }
      setupCounter();
    });
  }

  document.addEventListener('DOMContentLoaded', restoreCounter);

  window.onload = function () {
    console.log('window.onload');
    restoreCounter();
  };
})();