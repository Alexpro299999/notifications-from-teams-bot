window.addEventListener("teams-hook-event", (event) => {
    if (event.detail) {
        chrome.runtime.sendMessage(event.detail);
    }
});