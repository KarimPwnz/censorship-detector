/**
 * A Checker that runs checks and caches their results
 * 
 * @param {Context} context - Context to run checks in
 */
export default class Checker {
    constructor(context) {
        this.context = context;
        this.cacheStore = new Map();
    }

    /**
     * Run a check
     * 
     * @param {Check} check - check to run
     * @param {webRequestEvent} event - event to run check on
     * @param {boolean} [bypassCache=false]
     * @returns 
     */
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
