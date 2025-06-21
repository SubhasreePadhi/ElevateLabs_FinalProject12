// landing.js

const customDomainsTextarea = document.getElementById('customDomains');
const saveButton = document.getElementById('saveCustomDomains');
const saveStatusSpan = document.getElementById('saveStatus');

// Function to load existing custom domains from storage and populate the textarea
async function loadCustomDomains() {
    try {
        const response = await chrome.runtime.sendMessage({ action: "getCustomDomains" });
        if (response && response.customDomains) {
            customDomainsTextarea.value = response.customDomains.join('\n');
        } else {
            console.error("Privacy Shield Landing: Could not load custom domains.");
        }
    } catch (error) {
        console.error("Privacy Shield Landing: Error loading custom domains:", error);
    }
}

// Function to save custom domains to storage
saveButton.addEventListener('click', async () => {
    saveStatusSpan.textContent = "Saving...";
    saveStatusSpan.className = "text-sm text-gray-600 ml-4"; // Reset class

    const domainsInput = customDomainsTextarea.value;
    // Split by new line, filter out empty lines, and trim whitespace from each domain
    const domainsArray = domainsInput.split('\n')
                                    .map(line => line.trim())
                                    .filter(line => line.length > 0);

    try {
        const response = await chrome.runtime.sendMessage({ action: "updateCustomDomains", domains: domainsArray });
        if (response && response.success) {
            saveStatusSpan.textContent = "Saved successfully!";
            saveStatusSpan.className = "text-sm text-green-600 ml-4";
        } else {
            saveStatusSpan.textContent = "Failed to save.";
            saveStatusSpan.className = "text-sm text-red-600 ml-4";
            console.error("Privacy Shield Landing: Failed to update custom domains.");
        }
    } catch (error) {
        saveStatusSpan.textContent = "Error saving domains.";
        saveStatusSpan.className = "text-sm text-red-600 ml-4";
        console.error("Privacy Shield Landing: Error sending update custom domains message:", error);
    }
    // Clear status message after a few seconds
    setTimeout(() => {
        saveStatusSpan.textContent = "";
    }, 3000);
});

// Load custom domains when the page is loaded
document.addEventListener('DOMContentLoaded', loadCustomDomains);
