document.addEventListener('DOMContentLoaded', async () => {
    const data = await chrome.storage.local.get([
        "token", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode", "urgentWords"
    ]);

    if (data.token) document.getElementById('token').value = data.token;
    if (data.chatIds) document.getElementById('chatIds').value = data.chatIds;
    if (data.delay) document.getElementById('delay').value = data.delay || 2;
    if (data.quietStart) document.getElementById('quietStart').value = data.quietStart;
    if (data.quietEnd) document.getElementById('quietEnd').value = data.quietEnd;
    if (data.urgentWords) document.getElementById('urgentWords').value = data.urgentWords;

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

    ['quietHoursEnabled', 'privacyMode'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            chrome.storage.local.set({ [id]: e.target.checked });
        });
    });

    ['quietStart', 'quietEnd', 'delay', 'urgentWords'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            chrome.storage.local.set({ [id]: e.target.value });
        });
    });

    const views = {
        main: document.getElementById('mainView'),
        settings: document.getElementById('settingsView'),
        logs: document.getElementById('logsView')
    };

    function showView(viewName) {
        Object.values(views).forEach(el => el.classList.add('hidden'));
        views[viewName].classList.remove('hidden');
        if (viewName === 'logs') renderLogs();
    }

    document.getElementById('toSettings').addEventListener('click', () => showView('settings'));
    document.getElementById('toLogs').addEventListener('click', () => showView('logs'));
    document.querySelectorAll('.toMain').forEach(btn =>
        btn.addEventListener('click', () => showView('main'))
    );

    document.getElementById('save').addEventListener('click', () => {
        const token = document.getElementById('token').value.trim();
        const chatIds = document.getElementById('chatIds').value.trim();
        const delay = document.getElementById('delay').value;
        const urgentWords = document.getElementById('urgentWords').value;

        chrome.storage.local.set({ token, chatIds, delay, urgentWords }, () => {
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
                btn.textContent = "Test";
                btn.disabled = false;
                btn.style.borderColor = "";
                btn.style.color = "";
            }, 2000);
        });
    });

    document.getElementById('clearLogs').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: "clear_logs" });
        renderLogs(true);
    });

    async function renderLogs(clear = false) {
        const container = document.getElementById('logsList');
        if (clear) {
            container.innerHTML = '<div class="empty-logs">No recent activity</div>';
            return;
        }

        const data = await chrome.storage.local.get("logs");
        const logs = data.logs || [];

        if (logs.length === 0) {
            container.innerHTML = '<div class="empty-logs">No recent activity</div>';
            return;
        }

        container.innerHTML = logs.map(log => {
            const date = new Date(log.time);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            return `
                <div class="log-item type-${log.type}">
                    <div class="status-dot"></div>
                    <div class="log-info">
                        <div style="display:flex; justify-content:space-between;">
                            <span class="log-status">${log.status}</span>
                            <span class="log-time">${timeStr}</span>
                        </div>
                        <span class="log-details">${log.details}</span>
                    </div>
                </div>
            `;
        }).join('');
    }
});

function updateStatusLabel(enabled) {
    const label = document.getElementById('statusLabel');
    label.textContent = enabled ? "ACTIVE" : "OFF";
    label.style.color = enabled ? "var(--success)" : "var(--text-muted)";
}