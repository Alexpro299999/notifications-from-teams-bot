export async function addLog(status, details, type) {
    const data = await chrome.storage.local.get("logs");
    const logs = data.logs || [];
    logs.unshift({
        time: Date.now(),
        status,
        details,
        type
    });
    if (logs.length > 50) logs.pop();
    await chrome.storage.local.set({ logs });
}

export function isQuietTime(start, end) {
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

export function checkUrgent(title, body, words) {
    if (!words) return false;
    const targets = words.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
    if (targets.length === 0) return false;
    const text = ((title || "") + " " + (body || "")).toLowerCase();
    return targets.some(t => text.includes(t));
}

export async function updateBadge() {
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