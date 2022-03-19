import Context from "./context";
import { hasIgnoredOrigin } from "./global";
import LFUCache from "@akashbabu/lfu-cache";
import { getHost } from "../utils";

/**
 * Creates webRequestEvent listeners which run checks and report back to an EventTarget. Hosts are put in probation if they have already been ran (per a LFU policy) or are invalid
 * 
 * Refer to [CensorshipDetector's documentation]{@link censorshipdetector.js} for the list of events dispatched
 * 
 * @param {EventTarget} eventTarget - the EventTarget to report back to
 * @param {[Check]} checks - the checks to run
 */
export default class ChecksListenerCreator {
    constructor(eventTarget, checks) {
        this.eventTarget = eventTarget;
        this.checks = checks;
        this.hostsStore = new LFUCache({
            maxAge: 1000 * 60 * 60,
        });
    }

    /**
     * Create a listener for a webRequestEvent
     * 
     * The listener will go through the following steps:
     * 1. Dispatch "checksListenerRan"
     * 2. Check if a host is in probation and dispatch "hostProbation"
     * 3. Create a Context object to get a Checker
     * 4. Dispatch "checksStarted"
     * 5. For each check:
     *    1. Verify that the check can run on the webRequestEvent and dispatch "checkStart"
     *    2. Run the check on the webRequestEvent using the Context Checker
     *    3. (Asynchronously) If check succeeds, add to list of succeeded checks and dispatch "checkSuccess"
     *    4. (Asynchronously) If check fails, dispatch "checkFail"
     * 6. Dispatch list of succeeded checks via "checksEnded"
     * 
     * For the data in the dispatched event, refer to [CensorshipDetector's documentation]{@link censorshipdetector.js}
     * 
     * @param {webRequestEvent} webRequestEvent 
     */
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
                    new CustomEvent("checkStart", {
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
