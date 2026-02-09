const timers = new Map();

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "create") {
        handleCreate(request);
    } else if (request.type === "action") {
        const timeoutId = timers.get(request.id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timers.delete(request.id);
        }
    }
});

async function handleCreate(data) {
    const store = await chrome.storage.local.get(["token", "chatIds", "delay"]);
    if (!store.token || !store.chatIds) return;

    const timeoutId = setTimeout(() => {
        sendToTelegram(store, data);
        timers.delete(data.id);
    }, (parseInt(store.delay) || 60) * 1000);

    timers.set(data.id, timeoutId);
}

async function sendToTelegram(store, data) {
    const ids = store.chatIds.split(",").map(id => id.trim()).filter(id => id);
    const message = `🔔 <b>Teams (${data.domain})</b>\n\n<b>${data.title}</b>\n${data.body}`;

    for (const chatId of ids) {
        const url = `https://api.telegram.org/bot${store.token}/sendMessage`;
        try {
            await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML"
                })
            });
        } catch (e) {}
    }
}