import Fetcher from "./fetcher";
import dnsPacket from "dns-packet";
import base64url from "base64url";
import isIp from "is-ip";
import { DNS_TIMEOUT } from "./global";

/**
 * A DNS-over-HTTPS resolver
 * 
 * Caches results via its Fetcher
 */
export default class DoHResolver {
    constructor(fetcher = null) {
        this.fetcher = fetcher || new Fetcher();
    }

    async resolve(
        host,
        {
            server = "https://cloudflare-dns.com/dns-query",
            type = "A",
            timeout = DNS_TIMEOUT,
        } = {}
    ) {
        if (isIp(host)) {
            return [{ data: host }];
        }

        // Generate question packet
        let question = {
            type: "query",
            id: 1,
            flags: dnsPacket.RECURSION_DESIRED,
            questions: [
                {
                    type,
                    name: host,
                },
            ],
        };

        // Get destination URL and result packet
        let url = this._getDestinationUrl(this._encodePacket(question), server);
        let result = await this.fetcher.fetch(url, {
            options: {
                Accept: "application/dns-message",
                "Content-type": "application/dns-message",
            },
            timeout,
        });

        // Handle request errors
        if (result.timedOut) {
            throw new Error(`Request to DoH server (${server}) timed out!`);
        } else if (result.error) {
            throw new Error(`Request to DoH server (${server}) failed!`);
        }

        // Decode result packet
        let resPacket = Buffer.from(await result.response.arrayBuffer());
        return this._decodePacket(resPacket).answers;
    }

    _getDestinationUrl(packet, server) {
        let urlObj = new URL(server);
        urlObj.searchParams.append("dns", packet);
        return urlObj.toString();
    }

    _encodePacket(question) {
        return base64url(dnsPacket.encode(question));
    }

    _decodePacket(packet) {
        return dnsPacket.decode(packet);
    }
}
