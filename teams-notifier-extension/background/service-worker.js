import { addLog, isQuietTime, checkUrgent, updateBadge } from './utils.js';
import { sendToTelegram, sendTestMessage } from './telegram.js';

const timers = new Map();

chrome.runtime.onInstalled.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.storage.onChanged.addListener(updateBadge);

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
        sendTestMessage().then(success => sendResponse({ success }));
        return true;
    } else if (request.type === "clear_logs") {
        chrome.storage.local.set({ logs: [] });
    }
});

async function handleCreate(data) {
    const store = await chrome.storage.local.get([
        "token", "chats", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode", "urgentWords"
    ]);

    if (store.enabled === false) return;

    const hasChats = (store.chats && store.chats.length > 0) || (store.chatIds && store.chatIds.length > 0);
    if (!store.token || !hasChats) {
        addLog("Error", "Missing configuration", "error");
        return;
    }

    const isUrgent = checkUrgent(data.title, data.body, store.urgentWords);
    const quiet = store.quietHoursEnabled && isQuietTime(store.quietStart, store.quietEnd);

    if (quiet && !isUrgent) {
        addLog("Skipped", `Quiet Hours: ${data.title}`, "warning");
        return;
    }

    if (quiet && isUrgent) {
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