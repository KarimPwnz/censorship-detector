import Context from "./context";
import { hasIgnoredOrigin } from "./global";
import LFUCache from "@akashbabu/lfu-cache";
import { getHost } from "../utils";

export default class ChecksListenerCreator {
    constructor(eventTarget, checks) {
        this.eventTarget = eventTarget;
        this.checks = checks;
        this.hostsStore = new LFUCache({
            maxAge: 1000 * 60 * 60,
        });
    }

    create(webRequestEvent) {
        return (webRequestDetails) => {
            let eventDetail = {
                webRequestEvent,
                webRequestDetails,
                host: getHost(webRequestDetails.url),
                id: webRequestDetails.requestId,
                checksCount: this.checks.length,
            };

            this.eventTarget.dispatchEvent(
                new CustomEvent("checksListenerRan", { detail: eventDetail })
            );

            // Check if host in probation (currently being checked)
            let host = new URL(webRequestDetails.url).host;
            if (
                hasIgnoredOrigin(webRequestDetails) ||
                this.hostsStore.get(host)
            ) {
                this.eventTarget.dispatchEvent(
                    new CustomEvent("hostProbation", { detail: eventDetail })
                );
                return;
            }

            this.eventTarget.dispatchEvent(
                new CustomEvent("checksStarted", { detail: eventDetail })
            );

            // Add host to probation
            this.hostsStore.set(host, true);

            // Run checks
            let context = new Context(webRequestDetails);
            let successes = [];
            let checkPromises = [];
            for (let check of this.checks) {
                if (!check.hasOwnProperty(webRequestEvent)) {
                    continue;
                }
                this.eventTarget.dispatchEvent(
                    new CustomEvent("checkRun", {
                        detail: { ...eventDetail, check: check.meta },
                    })
                );
                let checkPromise = context.checker
                    .check(check, webRequestEvent)
                    .then((res) => {
                        if (res) {
                            successes.push(check.meta);
                            this.eventTarget.dispatchEvent(
                                new CustomEvent("checkSuccess", {
                                    detail: {
                                        ...eventDetail,
                                        check: check.meta,
                                    },
                                })
                            );
                        } else {
                            this.eventTarget.dispatchEvent(
                                new CustomEvent("checkFail", {
                                    detail: {
                                        ...eventDetail,
                                        check: check.meta,
                                    },
                                })
                            );
                        }
                    });
                checkPromises.push(checkPromise);
            }

            Promise.all(checkPromises).finally(() =>
                this.eventTarget.dispatchEvent(
                    new CustomEvent("checksEnded", {
                        detail: { ...eventDetail, successes },
                    })
                )
            );
        };
    }
}
