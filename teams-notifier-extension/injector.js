(function() {
    function generateId() {
        return Math.random().toString(36).substring(2, 15);
    }

    const OriginalNotification = window.Notification;

    window.Notification = function(title, options) {
        const id = generateId();
        const body = options ? options.body || "" : "";

        window.postMessage({
            source: "teams-hook",
            type: "create",
            id: id,
            domain: window.location.hostname,
            title: title,
            body: body
        }, "*");

        const instance = new OriginalNotification(title, options);

        instance.addEventListener("click", () => {
            window.postMessage({ source: "teams-hook", type: "action", id: id }, "*");
        });

        instance.addEventListener("close", () => {
            window.postMessage({ source: "teams-hook", type: "action", id: id }, "*");
        });

        return instance;
    };

    window.Notification.permission = OriginalNotification.permission;
    window.Notification.requestPermission = OriginalNotification.requestPermission;

    if (navigator.serviceWorker) {
        const originalShow = ServiceWorkerRegistration.prototype.showNotification;
        ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
            const id = generateId();
            window.postMessage({
                source: "teams-hook",
                type: "create",
                id: id,
                domain: window.location.hostname,
                title: title,
                body: options ? options.body || "" : ""
            }, "*");
            return originalShow.call(this, title, options);
        };
    }
})();