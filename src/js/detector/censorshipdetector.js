import ChecksListenerCreator from "./checkslistenercreator";
import { defaultChecks } from "./global";

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

    async start() {
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

    async stop() {
        for (let [event, listener] of Object.entries(this._listeners)) {
            browser.webRequest[event].removeListener(listener);
        }
    }
}
