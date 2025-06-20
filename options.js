// tracker_blocker_extension/options.js

const textarea = document.getElementById("domainList");
const saveBtn = document.getElementById("saveBtn");

chrome.storage.local.get(["customTrackers"], function(data) {
  if (data.customTrackers) {
    textarea.value = data.customTrackers.join("\n");
  }
});

saveBtn.addEventListener("click", function() {
  const domains = textarea.value.split("\n").map(s => s.trim()).filter(Boolean);
  chrome.storage.local.set({ customTrackers: domains });
  alert("Saved!");
});
