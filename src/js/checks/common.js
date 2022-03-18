const Deferred = require("../deferred").default;
const { browserInfo } = require("../detector/global");

export const RESOLVERS = [
    "https://dns9.quad9.net/dns-query",
    "https://cloudflare-dns.com/dns-query",
    "https://dns.google/dns-query",
];

// Inspired by Roskomsvoboda, censortracker, https://github.com/roskomsvoboda/censortracker/blob/main/src/common/js/errors.js
export const CONNECTION_ERRORS = new Set(
    browserInfo.name == "firefox"
        ? [
              "NS_ERROR_UNKNOWN_HOST",
              "NS_ERROR_CONNECTION_REFUSED",
              "NS_ERROR_NET_RESET",
              "NS_ERROR_NET_TIMEOUT"
          ]
        : [
              "net::ERR_NAME_NOT_RESOLVED",
              "net::ERR_CONNECTION_REFUSED",
              "net::ERR_TIMED_OUT",
              "net::ERR_CONNECTION_RESET",
              "net::ERR_CONNECTION_TIMED_OUT",
              "net::ERR_ADDRESS_UNREACHABLE",
          ]
);

export async function isLocallyUp(url, context) {
    let result = await context.fetcher.fetch(url, {
        options: { method: "HEAD", cache: "no-cache" },
        captureDetails: true,
    });
    return !CONNECTION_ERRORS.has(result.details.error);
}

// Inspired by eBay's port scanning, https://blog.nem.ec/2020/05/24/ebay-port-scanning/ (Dan Nemec)
export function isIpLocallyUp(host, { timeout = 10000 } = {}) {
    let upDeferred = new Deferred();
    let socket = new WebSocket(`wss://${host}`);
    socket.onerror = socket.onopen = () => upDeferred.resolve(true);
    setTimeout(() => upDeferred.resolve(false), timeout);
    return upDeferred.promise;
}

export async function isUp(url, context, host = null) {
    let reqUrl = `https://censor1338.karimrahal.com/api/isup?url=${encodeURIComponent(
        url
    )}`;
    if (host) {
        reqUrl += `&host=${host}`;
    }
    let result = await context.fetcher.fetch(reqUrl);
    let response = await result.response.json();
    if (response.error) {
        throw new Error("isUp check failed!");
    }
    return response.up;
}
