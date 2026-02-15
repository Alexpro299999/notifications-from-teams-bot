const timers = new Map();

chrome.runtime.onInstalled.addListener(() => {
    updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
    updateBadge();
});

chrome.storage.onChanged.addListener(() => {
    updateBadge();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "create") {
        handleCreate(request);
    } else if (request.type === "action") {
        const timeoutId = timers.get(request.id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timers.delete(request.id);
            addLog("Action", "Notification clicked/closed by user", "info");
        }
    } else if (request.type === "test_message") {
        sendTestMessage(request).then(success => sendResponse({ success }));
        return true;
    } else if (request.type === "clear_logs") {
        chrome.storage.local.set({ logs: [] });
    }
});

async function handleCreate(data) {
    const store = await chrome.storage.local.get([
        "token", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode", "urgentWords"
    ]);

    if (store.enabled === false) return;

    if (!store.token || !store.chatIds) {
        addLog("Error", "Missing configuration", "error");
        return;
    }

    const isUrgent = checkUrgent(data.title, data.body, store.urgentWords);

    if (!isUrgent && store.quietHoursEnabled && isQuietTime(store.quietStart, store.quietEnd)) {
        addLog("Skipped", `Quiet Hours: ${data.title}`, "warning");
        return;
    }

    if (isUrgent && store.quietHoursEnabled && isQuietTime(store.quietStart, store.quietEnd)) {
        addLog("Urgent", `Override Quiet Hours: ${data.title}`, "success");
    }

    if (store.privacyMode) {
        data.title = "New Message";
        data.body = "Content hidden due to privacy settings";
    }

    const delayTime = (parseInt(store.delay) || 2) * 1000;
    const timeoutId = setTimeout(() => {
        sendToTelegram(store, data);
        timers.delete(data.id);
    }, delayTime);

    timers.set(data.id, timeoutId);
}

function checkUrgent(title, body, words) {
    if (!words) return false;
    const targets = words.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
    if (targets.length === 0) return false;

    const text = ((title || "") + " " + (body || "")).toLowerCase();
    return targets.some(t => text.includes(t));
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
    return await sendToTelegram(store, data);
}

async function sendToTelegram(store, data) {
    const ids = store.chatIds.split(",").map(id => id.trim()).filter(id => id);
    const cleanTitle = data.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const cleanBody = data.body.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const message = `🔔 <b>Teams (${data.domain})</b>\n\n<b>${cleanTitle}</b>\n${cleanBody}`;

    let allSuccess = true;

    for (const chatId of ids) {
        const url = `https://api.telegram.org/bot${store.token}/sendMessage`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: "HTML",
                    disable_web_page_preview: true
                })
            });
            if (!response.ok) throw new Error(response.statusText);
        } catch (e) {
            allSuccess = false;
            addLog("Failed", `Error sending to ${chatId}: ${e.message}`, "error");
        }
    }

    if (allSuccess) {
        addLog("Sent", `${data.title}`, "success");
        return true;
    }
    return false;
}

async function addLog(status, details, type) {
    const data = await chrome.storage.local.get("logs");
    const logs = data.logs || [];
    logs.unshift({
        time: Date.now(),
        status,
        details,
        type
    });
    if (logs.length > 30) logs.pop();
    await chrome.storage.local.set({ logs });
}

async function updateBadge() {
    const store = await chrome.storage.local.get(["enabled", "quietHoursEnabled", "quietStart", "quietEnd"]);

    if (store.enabled === false) {
        chrome.action.setBadgeText({ text: "OFF" });
        chrome.action.setBadgeBackgroundColor({ color: "#666666" });
    } else if (store.quietHoursEnabled && isQuietTime(store.quietStart, store.quietEnd)) {
        chrome.action.setBadgeText({ text: "ZZZ" });
        chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    } else {
        chrome.action.setBadgeText({ text: "ON" });
        chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    }
}