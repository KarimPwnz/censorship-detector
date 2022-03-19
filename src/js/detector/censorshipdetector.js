import ChecksListenerCreator from "./checkslistenercreator";
import { defaultChecks } from "./global";

/**
 * The main CensorshipDetector driver
 * 
 * CensorshipDetector will dispatch the following events via the listeners created by ChecksListenerCreator:
 * - "checksListenerRan" when the listener is run
 * - "hostProbation" if a host is currently in probation (being scanned)
 * - "checksStarted" when the checks start
 * - "checkRun" for every check that runs
 * - "checkSuccess" when a check succeeds (returns true)
 * - "checkFail" when a check fails (returns false)
 * - "checksEnded" when all the checks have ended
 * 
 * Each event will have a detail object containing:
 * - webRequestEvent: the webRequest event ran on 
 * - webRequestDetails: the webRequest details, specific to the event (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest#events) 
 * - host: the host
 * - id: the webRequest id
 * - checksCount: the number of checks to run
 * 
 * In addition, "checksRun", "checksSuccess", and "checksFail" will contain:
 * - check: the check metadata (name, description, learnMore)
 * 
 * Similarly, checksEnded will contain:
 * - success: a list of the metadata (name, description, learnMore) of successful checks
 * 
 * @param {[string]} [webRequestEvents=["onErrorOccurred"]] - the webRequest events which we want to listen to (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest#events)
 * @param {[Check]} [checks=defaultChecks] - the checks to run upon our webRequest events
 * @param {[string]} [urls=["<all_urls>"]] - urls to listen for the webRequest events on
 */
export default class CensorshipDetector extends EventTarget {
    constructor({
        webRequestEvents = ["onErrorOccurred"],
        checks = defaultChecks,
        urls = ["<all_urls>"],
    } = {}) {
        super();
        this.webRequestEvents = webRequestEvents;
        this.checksListenerCreator = new ChecksListenerCreator(this, checks);
        this.urls = urls;
        this._listeners = {};
    }

    /**
     * Start listening to the webRequestEvents
     */
    start() {
        for (let event of this.webRequestEvents) {
            if (!this._listeners.hasOwnProperty(event)) {
                this._listeners[event] =
                    this.checksListenerCreator.create(event);
                browser.webRequest[event].addListener(this._listeners[event], {
                    urls: this.urls,
                });
            }
        }
    }

    /**
     * Stop listening to the webRequestEvents
     */
    stop() {
        for (let [event, listener] of Object.entries(this._listeners)) {
            browser.webRequest[event].removeListener(listener);
        }
    }
}
