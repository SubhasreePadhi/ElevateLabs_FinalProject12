// tracker_blocker_extension/background.js

const trackingDomains = [
  "tracker.example.com",
  "analytics.google.com",
  "ads.facebook.com",
  "doubleclick.net"
];

let blockedCount = 0;

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    const url = new URL(details.url);
    if (trackingDomains.some(domain => url.hostname.includes(domain))) {
      blockedCount++;
      chrome.action.setBadgeText({ text: blockedCount.toString() });
      return { cancel: true };
    }
  },
  { urls: ["<all_urls>"] },
  ["blocking"]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.command === "getBlockedCount") {
    sendResponse({ count: blockedCount });
  }
});