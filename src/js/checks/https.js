const ipCheck = require("./ip");
const dnsCheck = require("./dns");
const { isLocallyUp, isUp } = require("./common");

/**
 * Detect HTTPS filtering with the following steps:
 * 1. Verify site is objectively up over HTTPS
 * 2. Make sure that neither IP filtering nor DNS filtering checks fail
 * 3. Check if host locally down over HTTPS
 *
 * In other words, this relies on a process of elimination;
 * could give a false-positive if an unexpected filtering technique is used
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
            "HTTPS establishes a secure connection between yourself and the website. Unfortunately, its handshake is exposing to a blocking censor the website you are visiting. To bypass this censorship method, you can use encrypted SNI (ESNI), which is supported by browsers such as Firefox Extended Release.",
        learnMore: "https://google.com", // TODO
    },
};
