(function() {
    console.log("Teams Notifier Hook: Injector script loaded.");

    const SERVER_URL = "http://localhost:12345/notify";

    function sendToPython(title, options) {
        console.log("Teams Notifier Hook: Intercepted notification:", { title, options });
        const body = options ? options.body || "" : "";

        fetch(SERVER_URL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                domain: window.location.hostname,
                title: title,
                body: body
            })
        })
        .then(response => console.log("Teams Notifier Hook: Sent to Python server.", response))
        .catch(err => console.error("Teams Notifier Hook: FAILED to send to Python server.", err));
    }

    const OriginalNotification = window.Notification;
    window.Notification = function(title, options) {
        sendToPython(title, options);
        return new OriginalNotification(title, options);
    };
    window.Notification.permission = OriginalNotification.permission;
    window.Notification.requestPermission = OriginalNotification.requestPermission;
    console.log("Teams Notifier Hook: Overrode window.Notification.");

    if (navigator.serviceWorker) {
        const originalShow = ServiceWorkerRegistration.prototype.showNotification;
        ServiceWorkerRegistration.prototype.showNotification = function(title, options) {
            sendToPython(title, options);
            return originalShow.call(this, title, options);
        };
        console.log("Teams Notifier Hook: Overrode ServiceWorkerRegistration.prototype.showNotification.");
    }
})();