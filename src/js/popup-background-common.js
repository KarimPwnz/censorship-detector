export let infoStore = {
    set(key, info, json = true) {
        if (json) {
            info = JSON.stringify(info);
        }
        return localStorage.setItem(key, info);
    },
    get(key, json = true) {
        let data = localStorage.getItem(key);
        if (json) {
            data = JSON.parse(data);
        }
        return data;
    },
    has(key) {
        return Boolean(localStorage.getItem(key));
    },
};

export let hostsIndex = {
    index: infoStore.get("hostsIndex").length
        ? new Map(infoStore.get("hostsIndex"))
        : new Map(),
    isEmpty() {
        return this.index.size === 0;
    },
    add(host, successes) {
        this.delete(host); // to change order
        this.index.set(
            host,
            successes.map((check) => check.name)
        );
        this._save();
    },
    delete(host) {
        this.index.delete(host);
        this._save();
    },
    _save() {
        return infoStore.set("hostsIndex", [...this.index.entries()]);
    },
};

export let badge = {
    init() {
        browser.browserAction.setBadgeBackgroundColor({ color: "#e1a8c0" });
    },
    updateCount() {
        let count = infoStore.get("badgeCount", false) || 0;
        infoStore.set("badgeCount", ++count, false);
        browser.browserAction.setBadgeText({
            text: count.toString(),
        });
    },
    reset() {
        infoStore.set("badgeCount", 0, false);
        browser.browserAction.setBadgeText({
            text: "",
        });
    },
};
