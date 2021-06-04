const { CONNECTION_ERRORS, isLocallyUp } = require("./common");
const { getHost } = require("../utils");

/**
 * Detect HTTP (host header) filtering with the following steps:
 * 1. Verify http://foobar.com is locally up
 * 2. Send a request to http://foobar.com with the host header set to target host
 * 3. If the request is fails (via a connection error), then the host header is filtered
 */
module.exports = {
    async onErrorOccurred(context) {
        let sanityUp = isLocallyUp(
            `http://foobar.com/?v=${Date.now()}`,
            context
        );
        let result = await context.fetcher.fetch(
            `http://foobar.com/?v=${Date.now()}`, // TODO: use our own URL
            {
                options: {
                    method: "HEAD",
                    cache: "no-cache",
                    headers: { Host: getHost(context.webRequestDetails.url) },
                },
                captureDetails: true,
            }
        );
        if (!(await sanityUp)) {
            return false;
        }
        return CONNECTION_ERRORS.has(result.details.error);
    },
    meta: {
        name: "HTTP Filtering",
        description:
            "Elit amet aliquip laboris tempor aliqua. Dolore esse quis est proident aute Lorem ipsum dolore anim magna officia. Lorem in aute sit ipsum nostrud. Consectetur minim ex cillum incididunt reprehenderit nulla cillum qui quis. Voluptate nisi deserunt Lorem fugiat.", // TODO
        learnMore: "https://google.com", // TODO
    },
};
