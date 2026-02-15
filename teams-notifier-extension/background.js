const timers = new Map();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "create") {
        handleCreate(request);
    } else if (request.type === "action") {
        const timeoutId = timers.get(request.id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timers.delete(request.id);
        }
    } else if (request.type === "test_message") {
        sendTestMessage(request).then(success => sendResponse({ success }));
        return true;
    }
});

async function handleCreate(data) {
    const store = await chrome.storage.local.get([
        "token", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode"
    ]);

    if (store.enabled === false) return;
    if (!store.token || !store.chatIds) return;

    if (store.quietHoursEnabled && isQuietTime(store.quietStart, store.quietEnd)) {
        return;
    }

    if (store.privacyMode) {
        data.title = "New Message";
        data.body = "Content hidden due to privacy settings";
    }

    const delayTime = (parseInt(store.delay) || 60) * 1000;
    const timeoutId = setTimeout(() => {
        sendToTelegram(store, data);
        timers.delete(data.id);
    }, delayTime);

    timers.set(data.id, timeoutId);
}

function isQuietTime(start, end) {
    if (!start || !end) return false;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}

async function sendTestMessage(request) {
    const store = await chrome.storage.local.get(["token", "chatIds"]);
    if (!store.token || !store.chatIds) return false;

    const data = {
        domain: "Test System",
        title: "Connection Success",
        body: "This is a test notification."
    };
    await sendToTelegram(store, data);
    return true;
}

async function sendToTelegram(store, data) {
    const ids = store.chatIds.split(",").map(id => id.trim()).filter(id => id);
    const cleanTitle = data.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanBody = data.body.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const message = `🔔 <b>Teams (${data.domain})</b>\n\n<b>${cleanTitle}</b>\n${cleanBody}`;

    for (const chatId of ids) {
        const url = `https://api.telegram.org/bot${store.token}/sendMessage`;
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                })
            });
        } catch (e) {}
    }
}