import { rand } from "../utils";
import Deferred from "../deferred";
import { browserInfo } from "./global";

export class FirefoxLocalResolver {
    resolve(host, { timeout = 10000 } = {}) {
        let ipDeferred = new Deferred();
        browser.dns
            .resolve(host)
            .then((res) => ipDeferred.resolve(res.addresses[0]));
        setTimeout(() => ipDeferred.resolve(null), timeout);
        return ipDeferred.promise;
    }
}

/**
 * Chromium only exposes a DNS resolver extension API in the experimental branch
 * (https://bugs.chromium.org/p/chromium/issues/detail?id=598186).
 *
 * Therefore, the following approach instead takes advantage of the dnsResolve function exposed
 * to PAC scripts and the onProxyError event.
 * Within a PAC script, ChromeLocalResolver throws an exception of the resolved IP and captures it
 * in the onProxyError event listener.
 *
 * Once the dns resolver API is implemented in Chromium
 * (as per https://bugs.chromium.org/p/chromium/issues/detail?id=1063095),
 * this approach will be abandoned in favor of FirefoxLocalResolver's.
 *
 */
export class ChromeLocalResolver {
    resolve(host) {
        let ipDeferred = new Deferred();

        // Set onProxyError listener
        let id = rand();
        let listener = this._getErrorCallback(id, ipDeferred);
        browser.proxy.onProxyError.addListener(listener);

        // Create config
        let config = {
            mode: "pac_script",
            pacScript: {
                data: this._createPACScript(id, host),
            },
        };

        // Set proxy settings
        browser.proxy.settings.set(
            { value: config, scope: "regular" },
            () => {}
        );

        // Send request
        fetch(`https://${this._getIdHost(id)}/`).catch((_) => {});

        return ipDeferred.promise.finally(() =>
            browser.proxy.onProxyError.removeListener(listener)
        );
    }

    _getIdHost(id) {
        return `censorship-detector-${id}`;
    }

    _createPACScript(id, host) {
        // Escape host to prevent arbitrary code execution in script
        host = host.replaceAll("\\", "\\x5c").replaceAll("\"", "\\x22");
        return `function FindProxyForURL(url, host) {
            if (host == "${this._getIdHost(id)}") {
                throw "${id} " + dnsResolve("${host}");
            };
            return "DIRECT";
        }
        `;
    }

    _getErrorCallback(id, ipDeferred) {
        return (details) => {
            if (!details.details) {
                return;
            }
            // details.details has value "line: 3: Uncaught ${ID} ${IP}"
            let detailsArr = details.details.split(" ");
            let ip = detailsArr.pop();
            let detailsId = detailsArr.pop();
            if (detailsId != id) {
                return;
            }
            if (ip == "null") {
                ip = null;
            }
            ipDeferred.resolve(ip);
        };
    }
}

export function getLocalResolver() {
    if (browserInfo.name == "firefox") {
        return new FirefoxLocalResolver();
    }
    return new ChromeLocalResolver();
}
