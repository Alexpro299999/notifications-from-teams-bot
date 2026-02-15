import { addLog } from './utils.js';

export async function sendToTelegram(store, data) {
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

export async function sendTestMessage() {
    const store = await chrome.storage.local.get(["token", "chatIds"]);
    if (!store.token || !store.chatIds) return false;

    const data = {
        domain: "Test System",
        title: "Connection Success",
        body: "This is a test notification."
    };
    return await sendToTelegram(store, data);
}