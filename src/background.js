'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

const OPENAI_API_KEY = 'YOUR_API_KEY';

setInterval(() => {
  chrome.storage.local.get(['startTime']).then((result) => {
    let now = new Date();
    let startTime = result.startTime || new Date();
    let diff = now - new Date(startTime);
    let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if(minutes == 0) {
      chrome.storage.local.get(['totalHours']).then((result) => {
        let totalHours = result.totalHours || 0;
        chrome.storage.local.set({ totalHours: totalHours + 1 }).then(() => {
        });
      });
    }
    
  });
}, 1000);

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  // You can log specific properties like changeInfo.url if you're only interested in URL changes
  // get local storage if focus mode is on
  const {focusMode} = await chrome.storage.local.get(['focusMode']);
  const {openaikey} = await chrome.storage.local.get(['openaikey']);

  if (changeInfo.title && focusMode && openaikey) {
    fetch("https://api.openai.com/v1/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaikey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct",
        prompt: `Given a browser title, determine if it is an unproductive, uninformative time sink with very little or not. Distractions in particular. \n\nRespond only in the following json format.\n\n{ "time_sink": true/false}\n\nTitle: ${changeInfo.title}\n`,
        temperature: 0,
        max_tokens: 100,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    })
      .then(response => response.json())
      .then(data => {
        let json_string = data.choices[0].text;
        // replace everything before the first { and after the last }
        json_string = json_string.replace(/^[^{]+/, '');
        json_string = json_string.replace(/[^}]+$/, '');
        // replace all newlines
        json_string = json_string.replace(/\n/g, '');
        let responseData = JSON.parse(json_string);
        if (responseData['time_sink']) {
          // reset timer
          chrome.storage.local.set({ startTime: new Date().toString() }).then(() => {
            console.log('Timer reset'); 
          });
          console.log('Time sink detected', changeInfo.title);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon_48.png',
            title: 'Time Sink Detected',
            message: 'Careful! you are about to enter a time sink.' + changeInfo.title
          });
        }
      })
      .catch(error => console.error('Error:', error));
  }
});
