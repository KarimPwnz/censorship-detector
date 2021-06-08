export let storage = {
    set(key, value, jsonValue = true) {
        if (jsonValue) {
            value = JSON.stringify(value);
        }
        return localStorage.setItem(key, value);
    },
    get(key, jsonValue = true) {
        let value = localStorage.getItem(key);
        if (jsonValue) {
            value = JSON.parse(value);
        }
        return value;
    },
    has(key) {
        return Boolean(localStorage.getItem(key));
    },
};

export let hostsIndex = {
    index: storage.get("hostsIndex").length
        ? new Map(storage.get("hostsIndex"))
        : new Map(),
    isEmpty() {
        return this.index.size === 0;
    },
    add(host, successes) {
        this.index.delete(host); // to change order
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
        return storage.set("hostsIndex", [...this.index.entries()]);
    },
};

export let badge = {
    init() {
        browser.browserAction.setBadgeBackgroundColor({ color: "#e1a8c0" });
    },
    updateCount() {
        let count = storage.get("badgeCount", false) || 0;
        storage.set("badgeCount", ++count, false);
        browser.browserAction.setBadgeText({
            text: count.toString(),
        });
    },
    reset() {
        storage.set("badgeCount", 0, false);
        browser.browserAction.setBadgeText({
            text: "",
        });
    },
};
