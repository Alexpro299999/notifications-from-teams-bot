window.addEventListener("teams-hook-event", (event) => {
    if (event.detail) {
        try {
            if (chrome.runtime && chrome.runtime.id) {
                chrome.runtime.sendMessage(event.detail).catch(() => {});
            }
        } catch (e) {}
    }
});