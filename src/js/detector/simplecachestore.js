export class SimpleCacheStore {
    constructor() {
        this.cache = {};
    }

    static getObjectCacheKey(...args) {
        return JSON.stringify(args);
    }

    set(key, result) {
        this.cache[key] = result;
    }

    get(key) {
        if (this.has(key)) {
            return this.cache[key];
        }
        return null;
    }

    has(key) {
        return this.cache.hasOwnProperty(key);
    }
}

export class DefaultCacheStore extends SimpleCacheStore {
    constructor(defaultConstructor) {
        super();
        this.defaultConstructor = defaultConstructor;
    }

    get(key) {
        let cached = super.get(key);
        if (!cached) {
            cached = new this.defaultConstructor();
            this.set(key, cached);
        }
        return cached;
    }
}
