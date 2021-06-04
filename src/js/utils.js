// Aadit M Shah, https://stackoverflow.com/a/57888548
export function fetchTimeout(url, { options = {}, timeout = null } = {}) {
    let controller = new AbortController();
    let promise = fetch(url, { signal: controller.signal, ...options });
    if (!timeout) return promise;
    let timeoutObj = setTimeout(() => controller.abort(), timeout);
    return promise.finally(() => clearTimeout(timeoutObj));
}

export function rand() {
    return window.crypto.getRandomValues(new Uint32Array(1))[0];
}

// Christoph, mikemaccana, https://stackoverflow.com/a/679937
export function isObjEmpty(obj) {
    return Object.keys(obj).length === 0;
}

export function getHost(url) {
    return new URL(url).host;
}
