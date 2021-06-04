import Fetcher from "./fetcher";
import Checker from "./checker";
import DoHResolver from "./dohresolver";
import { getLocalResolver } from "./localresolver";

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
