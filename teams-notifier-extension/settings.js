document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get(["token", "chatIds", "delay"]);
    if (data.token) document.getElementById('token').value = data.token;
    if (data.chatIds) document.getElementById('chatIds').value = data.chatIds;
    if (data.delay) document.getElementById('delay').value = data.delay;
});

document.getElementById('save').addEventListener('click', () => {
    const token = document.getElementById('token').value.trim();
    const chatIds = document.getElementById('chatIds').value.trim();
    const delay = document.getElementById('delay').value;

    chrome.storage.local.set({ token, chatIds, delay }, () => {
        const btn = document.getElementById('save');
        const originalText = btn.textContent;
        btn.textContent = "Saved Successfully";
        btn.style.backgroundColor = "var(--success)";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = "";
        }, 1500);
    });
});