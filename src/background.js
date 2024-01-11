'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

setInterval(async () => {
  let { focusMode } = await chrome.storage.local.get(['focusMode']);

  chrome.storage.local.get(['startTime']).then((result) => {
    if (!focusMode) {
      chrome.action.setBadgeText({ text: '😴' });
      chrome.action.setBadgeBackgroundColor({ color: '#fff' });
      return;
    } else {
      chrome.action.setBadgeText({ text: '😠' });
      chrome.action.setBadgeBackgroundColor({ color: '#333' });
    }

    let now = new Date();
    let startTime = result.startTime || new Date();
    let diff = now - new Date(startTime);
    let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes == 0 && seconds == 0 && hours != 0) {
      chrome.storage.local.get(['totalHours']).then((result) => {
        let totalHours = result.totalHours || 0;
        // so 1 hour = 1 point, 2 hours = 2 points, 3 hours = 4 points, 4 hours = 8 points, etc.
        let points = Math.pow(2, (totalHours-1));
        chrome.storage.local.set({ totalHours: totalHours + points }).then(() => {
          console.log('Total hours', totalHours + points);
        });
      });
    }

  });
}, 1000);

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // You can log specific properties like changeInfo.url if you're only interested in URL changes
  // get local storage if focus mode is on
  const { focusMode } = await chrome.storage.local.get(['focusMode']);
  const { openaikey } = await chrome.storage.local.get(['openaikey']);
  const { filters } = await chrome.storage.local.get(['filters']) || 'Political Content, Sensationalist Gaming News, Tabloid News, Celebrity Entertainment, Sensationalism, Clickbait, Unreliable Sources';

  console.log('tab updated', tabId, changeInfo, tab);

  console.log('tab.title', tab.title);
  console.log('focusMode', focusMode);
  console.log('openaikey', openaikey);
  console.log('tab.url', tab.url);
  console.log('tab.status', tab.status);
  console.log('filters', filters);

  if (tab.title && focusMode && openaikey && !tab.url.includes('chrome://') && tab.status !== "loading" && filters) {
    console.log('tab updated', tabId, changeInfo, tab);
    fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaikey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Given a browser title,

        If it likely to fall in ${filters} output: true
        
        else false
        
        Title: ${tab.title}
        `,
        temperature: 0,
        max_tokens: 10,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })
      .then(response => response.json())
      .then(data => {
        let response = data.choices[0].text;
        // replace everything before the first { and after the last }
        console.log('response', response);
        if (response.toLowerCase().includes('true')) {
          // reset timer
          chrome.storage.local.set({ startTime: new Date().toString() }).then(() => {
            console.log('Timer reset');
          });
          console.log('Time sink detected', tab.title);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon_48.png',
            title: 'Time Sink Detected',
            message: 'Time sink detected: ' + tab.title + '. Resetting timer.'
          });
        }
      })
      .catch(error => console.error('Error:', error));
  }
});


// receive message from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.focusMode) {
    chrome.storage.local.set({ startTime: new Date().toString() }).then(() => {
      chrome.action.setBadgeText({ text: '😠' });
      chrome.action.setBadgeBackgroundColor({ color: '#333' });
    });
  } else {
    chrome.storage.local.set({ startTime: new Date().toString() }).then(() => {
      console.log('Timer stopped');
      chrome.action.setBadgeText({ text: '😴' });
      chrome.action.setBadgeBackgroundColor({ color: '#fff' });
    });
  }
});