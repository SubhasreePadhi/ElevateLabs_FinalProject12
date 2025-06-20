// tracker_blocker_extension/popup.js

chrome.runtime.sendMessage({ command: "getBlockedCount" }, function(response) {
  document.getElementById("count").textContent = response.count;
});
