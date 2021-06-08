import { fetchTimeout, rand, isObjEmpty } from "../utils";
import Deferred from "../deferred";
import { browserInfo } from "./global";

export default class Fetcher {
    constructor() {
        this.cacheStore = new Map();
    }

    _getResultObject() {
        return {
            headerId: rand(),
            requestId: null,
            error: false,
            timedOut: false,
            response: null,
            details: null,
        };
    }

    async fetch(
        url,
        {
            options = {},
            timeout = 10000,
            captureDetails = false,
            bypassCache = false,
        } = {}
    ) {
        let cacheKey = JSON.stringify(
            url,
            options,
            captureDetails,
            timeout
        );
        // Check cache
        if (!bypassCache && this.cacheStore.has(cacheKey)) {
            return this._parseResult(await this.cacheStore.get(cacheKey));
        }
        // Fetch
        let promise = this._internalFetch(url, {
            options,
            timeout,
            captureDetails,
        });
        // Save fetch promise in cache
        this.cacheStore.set(cacheKey, promise);
        // Return result
        return this._parseResult(await promise);
    }

    _parseResult(result) {
        result = Object.assign({}, result); // clone result
        if (result.response) {
            result.response = result.response.clone(); // clone Response object
        }
        return result;
    }

    async _internalFetch(url, { options, timeout, captureDetails } = {}) {
        let result = this._getResultObject();
        let headers = Object.assign({}, options.headers); // copy headers
        let listeners = [];
        if (captureDetails || !isObjEmpty(headers)) {
            // Replace headers in options with x-censorship-detector identifier header
            // (the headers are later set in the onBeforeSendHeaders event listener)
            options.headers = { "X-Censorship-Detector": result.headerId };
            // Set onBeforeSendHeaders listener
            listeners.push(this._setOnBeforeSendHeaders(url, result, headers));
        }
        if (captureDetails) {
            // Set onCompleted Listener
            listeners.push(this._setOnCompleted(url, result));
        }

        // Send request
        try {
            result.response = await fetchTimeout(url, { options, timeout });
        } catch (err) {
            result.error = true;
            result.timedOut = err.name == "AbortError";
        }

        // Wait for listening to end
        await Promise.all(listeners);

        return result;
    }

    _setOnBeforeSendHeaders(url, result, headers) {
        let requestIdDeferred = new Deferred();

        // Set listener
        let listener = (details) => {
            for (let [i, header] of details.requestHeaders.entries()) {
                // Check if request has correct header
                if (
                    header.name.toLowerCase() == "x-censorship-detector" &&
                    header.value == result.headerId
                ) {
                    // Remove header
                    details.requestHeaders.splice(i, 1);
                    // Store request id
                    result.requestId = details.requestId;
                    // Set headers
                    this._setRequestHeaders(headers, details.requestHeaders);
                    // Resolve deferred
                    requestIdDeferred.resolve();
                    break;
                }
            }

            return { requestHeaders: details.requestHeaders };
        };

        // Listen
        browser.webRequest.onBeforeSendHeaders.addListener(
            listener,
            { urls: this._getTargetUrls(url) },
            this._getOnBeforeSendHeadersSpecInfo()
        );

        return requestIdDeferred.promise.finally(() =>
            browser.webRequest.onBeforeSendHeaders.removeListener(listener)
        );
    }

    _getTargetUrls(url) {
        return [url, `${url}/`];
    }

    _setRequestHeaders(newHeaders, requestHeaders) {
        // Change headers
        newHeaders = Object.assign({}, newHeaders); // copy headers
        for (let header of requestHeaders) {
            if (newHeaders[header.name]) {
                header.value = newHeaders[header.name];
                delete newHeaders[header.name];
            }
        }
        // Add headers
        for (let [name, value] of Object.entries(newHeaders)) {
            requestHeaders.push({ name, value });
        }
    }

    _getOnBeforeSendHeadersSpecInfo() {
        let specInfo = ["blocking", "requestHeaders"];
        if (
            browserInfo.name == "chrome" &&
            parseInt(browserInfo.version) >= 79
        ) {
            specInfo.push("extraHeaders");
        }
        return specInfo;
    }

    _setOnCompleted(url, result) {
        let requestDetailsDeferred = new Deferred();

        // Set listener
        let listener = (details) => {
            if (result.requestId && details.requestId == result.requestId) {
                result.details = details;
                requestDetailsDeferred.resolve();
            }
        };

        // Listen
        let targetUrls = this._getTargetUrls(url);
        browser.webRequest.onCompleted.addListener(listener, {
            urls: targetUrls,
        });
        browser.webRequest.onErrorOccurred.addListener(listener, {
            urls: targetUrls,
        });

        return requestDetailsDeferred.promise.finally(() => {
            browser.webRequest.onCompleted.removeListener(listener);
            browser.webRequest.onErrorOccurred.removeListener(listener);
        });
    }
}
