// @ts-nocheck
'use strict';

import './popup.css';

(function () {

  let timer = null;

  function startTimer() {
    console.log('startTimer');
    timer = setInterval(function () {
      let now = new Date();
      chrome.storage.local.get(['startTime']).then((result) => {
        let startTime = result.startTime || new Date();
        let diff = now - new Date(startTime);
        let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((diff % (1000 * 60)) / 1000);
        let time = `${hours > 9 ? hours : '0' + hours}:${minutes > 9 ? minutes : '0' + minutes}:${seconds > 9 ? seconds : '0' + seconds}`
        document.getElementById('timer').innerHTML = time;
      });
    }, 1000);
  }

  function setupCounter() {
    document.getElementById('toggle')?.addEventListener('click', () => {
      // turn on focus mode
      let checked = document.getElementById('toggle').checked;

      if (checked) {
        chrome.storage.local.set({ focusMode: true }).then(() => {
          // start counter
          chrome.storage.local.set({ startTime: new Date().toString() }).then(() => {
            // send message to background.js
            chrome.runtime.sendMessage({ focusMode: true });
            if (!timer) startTimer();
          });
        });
      } else {
        chrome.storage.local.set({ focusMode: false }).then(() => {
          clearInterval(timer);
          timer = null;
          chrome.runtime.sendMessage({ focusMode: false });
          document.getElementById('timer').innerHTML = '00:00:00';
        });
      }
    });

  }



  function restoreCounter() {
    console.log('restoreCounter');
    let focusMode = false;

    chrome.storage.local.get(['totalHours']).then((result) => {
      let totalHours = result.totalHours || 0;
      document.getElementById('totalHours').innerHTML = `${totalHours}H`;
    });

    chrome.storage.local.get(['focusMode']).then((result) => {
      focusMode = result.focusMode || false;
      if (focusMode === true) {
        document.getElementById('toggle').checked = true;
        startTimer();
      } else {
        document.getElementById('toggle').checked = false;
      }
      setupCounter();
    });
  }

  document.addEventListener('DOMContentLoaded', restoreCounter);

  window.onload = async function () {
    console.log('window.onload');
    document.getElementById('openaikey').value = await chrome.storage.local.get(['openaikey']).then((result) => result.openaikey || '');
    document.getElementById('settings').addEventListener('click', () => {
      document.getElementById('settings-page').style.display = 'block';
      document.getElementById('main-page').style.display = 'none';
    });
    document.getElementById('cancelBtn').addEventListener('click', () => {
      document.getElementById('settings-page').style.display = 'none';
      document.getElementById('main-page').style.display = 'block';
    });
    document.getElementById('saveBtn').addEventListener('click', () => {
      if(document.getElementById('openaikey').value) chrome.storage.local.set({ openaikey: document.getElementById('openaikey').value });

      if(document.getElementById('filters').value) chrome.storage.local.set({ filters: document.getElementById('filters').value });

      document.getElementById('cancelBtn').innerHTML = 'Close';
      document.getElementById('saveBtn').innerHTML = 'Saved!'; 
    });
    restoreCounter();
  };
})();