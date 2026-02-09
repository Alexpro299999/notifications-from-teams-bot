const script = document.createElement('script');
script.src = chrome.runtime.getURL('injector.js');
(document.head || document.documentElement).appendChild(script);

window.addEventListener("message", (event) => {
    if (event.data && event.data.source === "teams-hook") {
        chrome.runtime.sendMessage(event.data);
    }
});