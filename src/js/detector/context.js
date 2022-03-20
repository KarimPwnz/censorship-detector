import Fetcher from "./fetcher";
import Checker from "./checker";
import DoHResolver from "./dohresolver";
import { getLocalResolver } from "./localresolver";

/**
 * A Context representing a webRequestEvent detector run
 * 
 * Contains a checker, fetcher, dohResolver, and localResolver. Context is useful for sharing the caches of all the objects mentioned: the checker caches check runs, the fetcher caches similar requests, and the dohResolver caches similar DNS queries (via the fetcher). Through one Context object, the caches can be accessed across multiple checks—or elsewhere
 * 
 * @param {webRequestDetails} webRequestDetails - the webRequestDetails associated with the context
 */
export default class Context {
    constructor(webRequestDetails) {
        this.webRequestDetails = webRequestDetails;
        // Set checker
        this.checker = new Checker(this);
        // Set fetcher
        this.fetcher = new Fetcher();
        // Set resolvers
        this.dohResolver = new DoHResolver(this.fetcher);
        this.localResolver = getLocalResolver();
    }
}
