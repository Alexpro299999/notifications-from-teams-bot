document.addEventListener('DOMContentLoaded', async () => {
    let chats = [];
    let editIndex = -1;

    const data = await chrome.storage.local.get([
        "token", "botName", "chats", "chatIds", "delay", "enabled",
        "quietHoursEnabled", "quietStart", "quietEnd",
        "privacyMode", "urgentWords"
    ]);

    if (!data.chats && data.chatIds) {
        chats = data.chatIds.split(',').filter(id => id.trim()).map(id => ({
            id: id.trim(),
            alias: ''
        }));
        await chrome.storage.local.set({ chats });
    } else {
        chats = data.chats || [];
    }

    if (data.token) document.getElementById('token').value = data.token;
    if (data.botName) {
        const botNameEl = document.getElementById('botName');
        botNameEl.textContent = data.botName;
        botNameEl.style.color = "var(--success)";
    }

    if (data.delay) document.getElementById('delay').value = data.delay || 2;
    if (data.urgentWords) document.getElementById('urgentWords').value = data.urgentWords;
    if (data.quietStart) document.getElementById('quietStart').value = data.quietStart;
    if (data.quietEnd) document.getElementById('quietEnd').value = data.quietEnd;

    document.getElementById('enabled').checked = data.enabled !== false;
    updateStatusLabel(data.enabled !== false);
    document.getElementById('quietHoursEnabled').checked = data.quietHoursEnabled === true;
    document.getElementById('privacyMode').checked = data.privacyMode === true;

    renderChats();

    document.getElementById('enabled').addEventListener('change', (e) => {
        chrome.storage.local.set({ enabled: e.target.checked });
        updateStatusLabel(e.target.checked);
    });

    ['quietHoursEnabled', 'privacyMode'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => chrome.storage.local.set({ [id]: e.target.checked }));
    });
    ['quietStart', 'quietEnd', 'delay', 'urgentWords'].forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => chrome.storage.local.set({ [id]: e.target.value }));
    });
    document.getElementById('token').addEventListener('change', (e) => chrome.storage.local.set({ token: e.target.value.trim() }));

    const views = { main: document.getElementById('mainView'), settings: document.getElementById('settingsView'), logs: document.getElementById('logsView') };
    const showView = (name) => {
        Object.values(views).forEach(el => el.classList.add('hidden'));
        views[name].classList.remove('hidden');
        if (name === 'logs') renderLogs();
    };
    document.getElementById('toSettings').addEventListener('click', () => showView('settings'));
    document.getElementById('toLogs').addEventListener('click', () => showView('logs'));
    document.querySelectorAll('.toMain').forEach(b => b.addEventListener('click', () => showView('main')));

    const modal = document.getElementById('chatModal');
    const modalChatId = document.getElementById('modalChatId');
    const modalChatAlias = document.getElementById('modalChatAlias');
    const modalSaveBtn = document.getElementById('modalSave');

    document.getElementById('addChatBtn').addEventListener('click', () => {
        editIndex = -1;
        modalChatId.value = '';
        modalChatAlias.value = '';
        modalChatId.disabled = false;
        document.getElementById('modalTitle').textContent = "Add Recipient";
        modalSaveBtn.textContent = "Add";
        modal.classList.remove('hidden');
        modalChatId.focus();
    });

    document.getElementById('modalCancel').addEventListener('click', () => modal.classList.add('hidden'));

    modalSaveBtn.addEventListener('click', async () => {
        const id = modalChatId.value.trim();
        let alias = modalChatAlias.value.trim();
        const token = document.getElementById('token').value.trim();

        if (!id) return modalChatId.focus();

        modalSaveBtn.textContent = "Checking...";
        modalSaveBtn.disabled = true;

        if (!alias && token) {
            try {
                const res = await fetch(`https://api.telegram.org/bot${token}/getChat?chat_id=${id}`);
                const json = await res.json();
                if (json.ok) {
                    const c = json.result;
                    if (c.title) alias = c.title;
                    else if (c.first_name) alias = [c.first_name, c.last_name].filter(Boolean).join(' ');
                    else if (c.username) alias = `@${c.username}`;

                    if (alias && alias.length > 20) alias = alias.substring(0, 20) + '...';
                }
            } catch (e) { console.error(e); }
        }

        const newChat = { id, alias: alias || 'Unknown' };

        if (editIndex >= 0) {
            chats[editIndex] = newChat;
        } else {
            if (chats.some(c => c.id === id)) {
                alert('This Chat ID already exists');
                modalSaveBtn.disabled = false;
                modalSaveBtn.textContent = "Add";
                return;
            }
            chats.push(newChat);
        }

        await chrome.storage.local.set({ chats });
        renderChats();
        modal.classList.add('hidden');
        modalSaveBtn.disabled = false;
    });

    function renderChats() {
        const container = document.getElementById('chatList');
        container.innerHTML = '';

        if (chats.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No recipients added</div>`;
            return;
        }

        chats.forEach((chat, index) => {
            const el = document.createElement('div');
            el.className = 'chat-item';
            el.innerHTML = `
                <div class="chat-id">${chat.id}</div>
                <div style="flex:1; margin:0 10px; min-width:0; text-align:right;">
                    <div class="chat-alias" title="${chat.alias}">${chat.alias}</div>
                </div>
                <div class="chat-actions">
                    <div class="action-icon edit" title="Edit">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </div>
                    <div class="action-icon delete" title="Delete">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </div>
                </div>
            `;

            el.querySelector('.edit').addEventListener('click', () => {
                editIndex = index;
                modalChatId.value = chat.id;
                modalChatId.disabled = true;
                modalChatAlias.value = chat.alias;
                document.getElementById('modalTitle').textContent = "Edit Alias";
                modalSaveBtn.textContent = "Save";
                modal.classList.remove('hidden');
                modalChatAlias.focus();
            });

            el.querySelector('.delete').addEventListener('click', async () => {
                if(confirm('Remove this recipient?')) {
                    chats.splice(index, 1);
                    await chrome.storage.local.set({ chats });
                    renderChats();
                }
            });

            container.appendChild(el);
        });
    }

    document.getElementById('save').addEventListener('click', async () => {
        const btn = document.getElementById('save');
        const token = document.getElementById('token').value.trim();
        const botNameEl = document.getElementById('botName');

        btn.textContent = "Checking...";
        btn.disabled = true;
        botNameEl.textContent = "";

        let botName = "";
        let isValid = false;

        if (token) {
            try {
                const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
                const json = await res.json();
                if (json.ok) {
                    botName = json.result.first_name;
                    isValid = true;
                } else {
                    botName = "Invalid Token";
                }
            } catch (e) {
                botName = "Error";
            }
        }

        if (isValid) {
            await chrome.storage.local.set({ token, botName });
            botNameEl.textContent = botName;
            botNameEl.style.color = "var(--success)";
            btn.textContent = "Saved!";
            btn.style.backgroundColor = "var(--success)";
        } else {
            botNameEl.textContent = botName || "Error";
            botNameEl.style.color = "var(--error)";
            btn.textContent = "Error";
            btn.style.backgroundColor = "var(--error)";
        }

        setTimeout(() => {
            btn.textContent = "Save";
            btn.style.backgroundColor = "";
            btn.disabled = false;
        }, 1500);
    });

    document.getElementById('test').addEventListener('click', () => {
        const btn = document.getElementById('test');
        btn.textContent = "..."; btn.disabled = true;
        chrome.runtime.sendMessage({ type: "test_message" }, (res) => {
            btn.textContent = (res && res.success) ? "OK" : "Err";
            btn.style.borderColor = (res && res.success) ? "var(--success)" : "var(--error)";
            btn.style.color = (res && res.success) ? "var(--success)" : "var(--error)";
            setTimeout(() => { btn.textContent = "Test"; btn.disabled = false; btn.style.borderColor = ""; btn.style.color = ""; }, 2000);
        });
    });

    document.getElementById('clearLogs').addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: "clear_logs" });
        renderLogs(true);
    });

    async function renderLogs(clear) {
        const c = document.getElementById('logsList');
        if (clear) { c.innerHTML = '<div class="empty-logs">No activity</div>'; return; }
        const d = await chrome.storage.local.get("logs");
        const logs = d.logs || [];
        if (!logs.length) { c.innerHTML = '<div class="empty-logs">No activity</div>'; return; }
        c.innerHTML = logs.map(l => `
            <div class="log-item type-${l.type}">
                <div class="status-dot"></div>
                <div style="flex:1; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
                        <span style="font-weight:700; color:inherit;">${l.status}</span>
                        <span style="color:var(--text-muted); font-size:10px;">${new Date(l.time).toLocaleTimeString()}</span>
                    </div>
                    <div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${l.details}</div>
                </div>
            </div>`).join('');
    }

    function updateStatusLabel(enabled) {
        const l = document.getElementById('statusLabel');
        l.textContent = enabled ? "ON" : "OFF";
        l.style.color = enabled ? "var(--success)" : "var(--text-muted)";
    }
});