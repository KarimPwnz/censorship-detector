const { isUp, isLocallyUp, isIpLocallyUp } = require("./common");
const { getHost } = require("../utils");

/**
 * Detect IP/TCP filtering with the following steps:
 * 1. Verify that site is locally down
 * 2. Get objective A records (IPs) from DoH resolver
 * 3. For each IP:
 *  3.1 Verify that IP is valid
 *  3.2 Check if HTTP request to IP (with host header set to target host)
 *      is objectively up but locally down
 */
module.exports = {
    async onErrorOccurred(context) {
        let host = getHost(context.webRequestDetails.url);
        // Start sanity promise
        let locallyUp = isLocallyUp(context.webRequestDetails.url, context);

        // Start query promise
        let queryPromise = context.dohResolver.resolve(host);

        // Check if sanity failed
        if (await locallyUp) {
            return false;
        }

        let answers = await queryPromise;
        for (let answer of answers) {
            if (!answer.data) {
                continue;
            }
            let httpUp = isUp(`http://${answer.data}`, context, host);
            let ipLocallyUp = isIpLocallyUp(answer.data);
            if ((await httpUp) && !(await ipLocallyUp)) {
                return true;
            }
        }
        return false;
    },
    meta: {
        name: "IP/TCP Filtering",
        description:
            "Your browser communicates to the website using its IP address. However, for your data to reach the IP address, it is going through a blocking censor on your network, possibly your internet service provider (ISP). This can be circumvented by using a VPN or proxy.",
        learnMore: "https://google.com", // TODO
    },
};
