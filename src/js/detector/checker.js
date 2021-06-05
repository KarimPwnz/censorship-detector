import { DefaultCacheStore } from "./simplecachestore";

export default class Checker {
    constructor(context) {
        this.context = context;
        this.cacheStore = new DefaultCacheStore(Object);
    }

    check(check, event, { bypassCache = false } = {}) {
        let cachedCheck = this.cacheStore.get(check.meta.name);
        // Check if bypass cache or cache does not exist
        if (bypassCache || !cachedCheck[event]) {
            cachedCheck[event] = check[event](this.context);
        }
        return cachedCheck[event];
    }
}
