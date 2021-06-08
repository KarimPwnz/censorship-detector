export default class Checker {
    constructor(context) {
        this.context = context;
        this.cacheStore = new Map();
    }

    check(check, event, { bypassCache = false } = {}) {
        let cachedCheck = this.cacheStore.get(check.meta.name) || {};
        // Check if bypass cache or cache does not exist
        if (bypassCache || !cachedCheck.hasOwnProperty(event)) {
            cachedCheck[event] = check[event](this.context);
            this.cacheStore.set(check.meta.name, cachedCheck);
        }
        return cachedCheck[event];
    }
}
