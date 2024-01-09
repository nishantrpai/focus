// @ts-nocheck
'use strict';

import './popup.css';

(function () {

  let timer = '';
  let startTime = '';

  function startTimer() {
    timer = setInterval(function () {
      let now = new Date();
      let diff = now - new Date(startTime);
      let days = Math.floor(diff / (1000 * 60 * 60 * 24));
      let months = Math.floor(days / 31);
      let years = Math.floor(months / 12);
      days = days % 31;
      months = months % 12;
      let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let seconds = Math.floor((diff % (1000 * 60)) / 1000);
      let time = `${hours > 9 ? hours : '0' + hours}:${minutes > 9 ? minutes : '0' + minutes}:${seconds > 9 ? seconds : '0' + seconds}`
      console.log(time);
      document.getElementById('timer').innerHTML = time;
    }, 1000);
  }

  function setupCounter() {
    console.log('setupCounter');
    document.getElementById('toggle')?.addEventListener('click', () => {
      // turn on focus mode
      let checked = document.getElementById('toggle').checked;

      if (checked) {
        console.log('focus mode on');
        chrome.storage.local.set({ focusMode: true }).then(() => {
          // start counter
          startTime = new Date();
          chrome.storage.local.set({ startTime: new Date() }).then(() => {
            console.log('start time is set');
          });
          if(!timer) startTimer();
        });
      } else {
        chrome.storage.local.set({ focusMode: false }).then(() => {
          console.log('Value is set to false');
          // stop counter
          clearInterval(timer);
          document.getElementById('timer').innerHTML = '00:00:00';
        });
      }
    });

  }



  function restoreCounter() {
    console.log('restoreCounter');
    let focusMode = false;
    chrome.storage.local.get(['startTime']).then((result) => {
      startTime = result.startTime || new Date();
    });
    chrome.storage.local.get(['focusMode']).then((result) => {
      focusMode = result.focusMode || false;
    });
    if (focusMode === true) {
      document.getElementById('toggle').checked = true;
      startTimer();
    } else {
      document.getElementById('toggle').checked = false;
    }
    setupCounter();
  }

  document.addEventListener('DOMContentLoaded', restoreCounter);

  window.onload = async function () {
    console.log('window.onload');
    restoreCounter();
  };
})();