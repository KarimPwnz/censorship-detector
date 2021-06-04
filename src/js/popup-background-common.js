import { isObjEmpty } from "./utils";

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
    index: infoStore.get("hostsIndex") || {},
    isEmpty() {
        return isObjEmpty(this.index);
    },
    add(host, successes) {
        this.remove(host);
        this.index[host] = successes.map((check) => check.name);
        return infoStore.set("hostsIndex", this.index);
    },
    remove(host) {
        if (this.index.hasOwnProperty(host)) {
            delete this.index[host];
        }
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
