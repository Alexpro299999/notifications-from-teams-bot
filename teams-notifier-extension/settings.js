document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get([
        "token", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode"
    ]);

    if (data.token) document.getElementById('token').value = data.token;
    if (data.chatIds) document.getElementById('chatIds').value = data.chatIds;
    if (data.delay) document.getElementById('delay').value = data.delay || 2;
    if (data.quietStart) document.getElementById('quietStart').value = data.quietStart;
    if (data.quietEnd) document.getElementById('quietEnd').value = data.quietEnd;

    const isEnabled = data.enabled !== false;
    document.getElementById('enabled').checked = isEnabled;
    updateStatusLabel(isEnabled);

    document.getElementById('quietHoursEnabled').checked = data.quietHoursEnabled === true;
    document.getElementById('privacyMode').checked = data.privacyMode === true;

    document.getElementById('enabled').addEventListener('change', (e) => {
        const enabled = e.target.checked;
        chrome.storage.local.set({ enabled });
        updateStatusLabel(enabled);
    });

    document.getElementById('quietHoursEnabled').addEventListener('change', (e) => {
        chrome.storage.local.set({ quietHoursEnabled: e.target.checked });
    });

    document.getElementById('privacyMode').addEventListener('change', (e) => {
        chrome.storage.local.set({ privacyMode: e.target.checked });
    });

    document.getElementById('quietStart').addEventListener('change', (e) => {
        chrome.storage.local.set({ quietStart: e.target.value });
    });

    document.getElementById('quietEnd').addEventListener('change', (e) => {
        chrome.storage.local.set({ quietEnd: e.target.value });
    });

    document.getElementById('delay').addEventListener('change', (e) => {
        chrome.storage.local.set({ delay: e.target.value });
    });
});

function updateStatusLabel(enabled) {
    const label = document.getElementById('statusLabel');
    label.textContent = enabled ? "ACTIVE" : "OFF";
    label.style.color = enabled ? "var(--success)" : "var(--text-muted)";
}

document.getElementById('toSettings').addEventListener('click', () => {
    document.getElementById('mainView').classList.add('hidden');
    document.getElementById('settingsView').classList.remove('hidden');
});

document.getElementById('toMain').addEventListener('click', () => {
    document.getElementById('settingsView').classList.add('hidden');
    document.getElementById('mainView').classList.remove('hidden');
});

document.getElementById('save').addEventListener('click', () => {
    const token = document.getElementById('token').value.trim();
    const chatIds = document.getElementById('chatIds').value.trim();
    const delay = document.getElementById('delay').value;

    chrome.storage.local.set({ token, chatIds, delay }, () => {
        const btn = document.getElementById('save');
        const originalText = btn.textContent;
        btn.textContent = "Saved!";
        btn.style.backgroundColor = "var(--success)";
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = "";
        }, 1500);
    });
});

document.getElementById('test').addEventListener('click', () => {
    const btn = document.getElementById('test');
    const originalText = btn.textContent;
    btn.textContent = "...";
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: "test_message" }, (response) => {
        if (response && response.success) {
            btn.textContent = "OK";
            btn.style.borderColor = "var(--success)";
            btn.style.color = "var(--success)";
        } else {
            btn.textContent = "Err";
            btn.style.borderColor = "#ef4444";
            btn.style.color = "#ef4444";
        }
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
            btn.style.borderColor = "";
            btn.style.color = "";
        }, 2000);
    });
});