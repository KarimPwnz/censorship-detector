import { detect } from "detect-browser";

export const browserInfo = detect();

export const defaultChecks = [
    require("../checks/ip"),
    require("../checks/dns"),
    require("../checks/http"),
    require("../checks/https"),
];

export const ignoredOrigins = new Set([
    browserInfo.name == "firefox"
        ? browser.runtime.getURL("_generated_background_page.html")
        : browser.runtime.getURL("").slice(0, -1),
]);

export function hasIgnoredOrigin(details) {
    let targetProperty =
        browserInfo.name == "firefox" ? "originUrl" : "initiator";
    return ignoredOrigins.has(details[targetProperty]);
}

/* Timeouts */

export const DNS_TIMEOUT = 10000;
export const FETCHER_TIMEOUT = 10000;
