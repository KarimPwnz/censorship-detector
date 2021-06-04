import { DefaultCacheStore } from "./simplecachestore";

export default class Checker {
    constructor(context) {
        this.context = context;
        this.cacheStore = new DefaultCacheStore(Object);
    }

    check(check, event, { bypassCache = false } = {}) {
        // Check cache
        let cachedCheck = this.cacheStore.get(check.meta.name);
        if (!bypassCache && cachedCheck[event]) {
            return cachedCheck[event];
        }
        // Run and cache check
        cachedCheck[event] = check[event](this.context);
        return cachedCheck[event];
    }
}
