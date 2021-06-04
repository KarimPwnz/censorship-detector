const ipCheck = require("./ip");
const dnsCheck = require("./dns");
const { isLocallyUp, isUp } = require("./common");

/**
 * Detect HTTPS filtering with the following steps:
 * 1. Verify site is objectively up over HTTPS
 * 2. Make sure that IP filtering nor DNS filtering checks fail
 * 3. Verify site is locally down over HTTPS
 *
 * Shortcomings:
 * - Cannot detect HTTPS filtering if IP or DNS filtering exists
 */
module.exports = {
    async onErrorOccurred(context) {
        // Setup URL
        let urlObj = new URL(context.webRequestDetails.url);
        urlObj.protocol = "https:";
        let url = urlObj.toString();

        // Start locallyUp promise
        let locallyUp = isLocallyUp(url, context);

        // Start sanity promises
        let up = isUp(url, context);
        let ipFiltering = context.checker.check(ipCheck, "onErrorOccurred");
        let dnsFiltering = context.checker.check(dnsCheck, "onErrorOccurred");

        // Check if sanity failed
        if (!(await up) || (await ipFiltering) || (await dnsFiltering)) {
            return false;
        }

        return !(await locallyUp);
    },
    meta: {
        name: "HTTPS Filtering",
        description:
            "Cillum est nisi excepteur aliquip ullamco nisi cillum consequat nostrud voluptate quis non laboris excepteur. Consequat tempor proident quis labore amet elit. Ullamco aute commodo officia do duis dolor. Labore ipsum Lorem esse eiusmod fugiat est dolore.", // TODO
        learnMore: "https://google.com", // TODO
    },
};
