// popup.js

const toggleSwitch = document.getElementById('toggle');
const statusMessage = document.getElementById('statusMessage');
const refreshButton = document.getElementById('refreshButton');

// Function to update the UI based on blocking status
function updateUI(isEnabled) {
    toggleSwitch.checked = isEnabled;
    statusMessage.textContent = isEnabled ? "Tracking blocking is active." : "Tracking blocking is inactive.";
    statusMessage.className = `text-center text-sm mb-4 ${isEnabled ? 'text-green-600' : 'text-red-600'}`;
}

// Function to fetch and display the current blocking status
async function getBlockingStatus() {
    try {
        const response = await chrome.runtime.sendMessage({ action: "getBlockingStatus" });
        if (response) {
            updateUI(response.isEnabled);
        } else {
            statusMessage.textContent = "Could not get status.";
            statusMessage.className = "text-center text-sm mb-4 text-gray-600";
            console.error("Privacy Shield Popup: No response for blocking status.");
        }
    } catch (error) {
        statusMessage.textContent = "Error fetching status.";
        statusMessage.className = "text-center text-sm mb-4 text-red-600";
        console.error("Privacy Shield Popup: Error fetching blocking status:", error);
    }
}

// Event listener for the toggle switch
toggleSwitch.addEventListener('change', async (event) => {
    const isEnabled = event.target.checked;
    statusMessage.textContent = "Updating...";
    statusMessage.className = "text-center text-sm mb-4 text-gray-600";

    try {
        const response = await chrome.runtime.sendMessage({ action: "toggleBlocking", isEnabled: isEnabled });
        if (response && response.success) {
            updateUI(response.isEnabled);
        } else {
            statusMessage.textContent = "Failed to update blocking status.";
            statusMessage.className = "text-center text-sm mb-4 text-red-600";
            // Revert toggle state if update failed
            toggleSwitch.checked = !isEnabled;
        }
    } catch (error) {
        statusMessage.textContent = "Error updating blocking status.";
        statusMessage.className = "text-center text-sm mb-4 text-red-600";
        console.error("Privacy Shield Popup: Error toggling blocking:", error);
        // Revert toggle state on error
        toggleSwitch.checked = !isEnabled;
    }
});

// Event listener for the refresh button
refreshButton.addEventListener('click', getBlockingStatus);

// Fetch status when the popup is opened
document.addEventListener('DOMContentLoaded', getBlockingStatus);
