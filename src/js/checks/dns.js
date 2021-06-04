const { RESOLVERS, isLocallyUp } = require("./common");
const { getHost } = require("../utils");

/**
 * Based on OONI's nettests/ts-002-dns-consistency spec
 * (https://github.com/ooni/spec/blob/master/nettests/ts-002-dns-consistency.md)
 *
 * Detect DNS filtering with the following steps:
 * 1. Verify that site is locally down
 * 2. Get local IP
 * 3. Get objective IP and its PTR record
 * 4. Check if both objective IPs and local IP null (i.e NXDomain)
 * 5. For each A record (IP) in each resolver:
 *  5.1 Verify that IP is not null
 *  5.2 Check if IP matches local IP; if so, return false (no DNS filtering)
 *  5.3 Get PTR records for IP
 *  5.4 Compare PTR records with those of local IP; if match, return false (no DNS filtering)
 * 6. If end is reached, DNS filtering exists
 *
 * Shortcomings:
 * - Prone to false-positives due to DNS load-balancing
 * - Depends on original request to fail, so it doesn't detect via-DNS block pages
 *   (this is because of the false-positivity)
 *
 * To deal with the shortcomings, the approach for DNS filtering detection outlined
 * in "Characterizing Web Censorship Worldwide: Another Look at the OpenNet Initiative Data"
 * (Gill et al.) should be adopted once enough data is present
 */
module.exports = {
    async onErrorOccurred(context) {
        // Start sanity promise
        let locallyUp = isLocallyUp(context.webRequestDetails.url, context);

        // Prologue
        let host = getHost(context.webRequestDetails.url);
        let localIp =
            context.webRequestDetails.ip ||
            (await context.localResolver.resolve(host));

        // Get ptr records
        let localPtrRecordPromise = context.dohResolver.resolve(localIp, {
            type: "PTR",
        });

        // Start control answers resolution promise
        let controlARecordsPromise = context.dohResolver.resolve(host);

        // Check if sanity failed
        if (await locallyUp) {
            return false;
        }

        let localPtrRecord = (await localPtrRecordPromise)[0];
        let controlARecords = await controlARecordsPromise;

        // Check if NXDomain
        if (!controlARecords.length && !ip) {
            return false;
        }

        // Compare
        for (let server of RESOLVERS) {
            for (let answer of controlARecords) {
                if (!answer) {
                    continue;
                }
                // Check if IP matches
                if (answer.data == localIp) {
                    return false;
                }
                // Check if ptr records match for control IP
                let controlPtrRecord = (
                    await context.dohResolver.resolve(answer.data, {
                        server,
                        type: "PTR",
                    })
                )[0];
                if (controlPtrRecord == localPtrRecord) {
                    return false;
                }
            }
        }

        return true;
    },
    meta: {
        name: "DNS Filtering",
        description:
            "Qui irure anim incididunt aliqua aliquip excepteur ea culpa. Esse amet dolor enim et enim pariatur irure elit aute ex consectetur. Labore ex voluptate deserunt cillum dolore veniam irure exercitation nulla.", // TODO
        learnMore: "https://google.com", // TODO
    },
};
