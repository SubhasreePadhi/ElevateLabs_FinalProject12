// background.js

// Define a list of common tracking domains/patterns.
// This list is built-in and always active if blocking is enabled.
const TRACKING_DOMAINS = [
    "google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "facebook.com/tr", // Facebook Pixel
    "analytics.twitter.com",
    "ads.linkedin.com",
    "pixel.adsafeprotected.com",
    "ad.atdmt.com",
    "matomo.org",
    "criteo.com",
    "hotjar.com",
    "segment.io",
    "mixpanel.com",
    "newrelic.com",
    "app.pendo.io",
    "googlesyndication.com",
    "adnxs.com",
    "ampproject.net"
];

// Generate declarativeNetRequest rules from a given list of domains.
// This function now takes an array of domains and an ID offset for unique rule IDs.
function generateRulesFromDomains(domains, idOffset = 0) {
    return domains.map((domain, index) => ({
        id: idOffset + index + 1, // Unique ID for each rule, starting from 1 + offset
        priority: 1, // High priority
        action: {
            type: "block" // Block the request
        },
        condition: {
            urlFilter: `*://*.${domain.trim()}/*`, // Match any subdomain and any path
            resourceTypes: [
                "script",
                "image",
                "stylesheet",
                "xmlhttprequest",
                "ping",
                "other"
            ] // Apply to various resource types, especially 'script'
        }
    })).filter(rule => rule.condition.urlFilter.length > 0); // Filter out empty filters
}

// Function to update all active blocking rules (built-in + custom)
async function updateAllBlockingRules() {
    // Get custom domains from storage
    const storageResult = await chrome.storage.local.get(["customTrackingDomains", "isBlockingEnabled"]);
    const customDomains = storageResult.customTrackingDomains || [];
    const isBlockingEnabled = storageResult.isBlockingEnabled !== false; // Default to true

    if (!isBlockingEnabled) {
        // If overall blocking is disabled, remove all rules and exit
        const existingDynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingDynamicRules.map(rule => rule.id)
        });
        console.log("Privacy Shield: All blocking rules removed due to disabled state.");
        return;
    }

    // Combine built-in and custom domains, ensuring uniqueness
    const allDomains = [...new Set([...TRACKING_DOMAINS, ...customDomains.filter(d => d.trim() !== '')])];

    // Generate rules for all combined domains
    // Assign unique IDs by providing a large offset for custom rules or just regenerating all
    // For simplicity, let's just regenerate all rules with new IDs starting from 1
    const allRules = generateRulesFromDomains(allDomains);

    try {
        // First, get all currently active dynamic rules to remove them
        const existingDynamicRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingDynamicRules.map(rule => rule.id);

        // Then, update with the new set of rules
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingRuleIds, // Remove all previously added dynamic rules
            addRules: allRules
        });
        console.log("Privacy Shield: All blocking rules updated successfully.");
    } catch (error) {
        console.error("Privacy Shield: Error updating declarativeNetRequest rules:", error);
    }
}

// Listener for messages from popup.js and landing.js
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "toggleBlocking") {
        const isEnabled = message.isEnabled;
        await chrome.storage.local.set({ isBlockingEnabled: isEnabled });
        await updateAllBlockingRules(); // Re-evaluate and apply rules based on new state
        sendResponse({ success: true, isEnabled: isEnabled });
    } else if (message.action === "getBlockingStatus") {
        const result = await chrome.storage.local.get("isBlockingEnabled");
        const isEnabled = result.isBlockingEnabled !== false; // Default to true if not set
        sendResponse({ isEnabled: isEnabled });
    } else if (message.action === "updateCustomDomains") {
        const newCustomDomains = message.domains; // Expecting an array of strings
        await chrome.storage.local.set({ customTrackingDomains: newCustomDomains });
        await updateAllBlockingRules(); // Re-evaluate and apply rules with new custom domains
        sendResponse({ success: true });
    } else if (message.action === "getCustomDomains") {
        const result = await chrome.storage.local.get("customTrackingDomains");
        sendResponse({ customDomains: result.customTrackingDomains || [] });
    }
    return true; // Keep the message channel open for sendResponse
});

// Initial setup when service worker starts or wakes up
// This ensures the rules are applied based on the last saved state.
(async () => {
    // Attempt to load and apply existing rules.
    await updateAllBlockingRules();
})();