import CensorshipDetector from "./detector/censorshipdetector";
import { infoStore, hostsIndex, badge } from "./popup-background-common";

function run() {
    badge.init();

    let detector = new CensorshipDetector();
    detector.addEventListener("checksEnded", (e) => {
        if (e.detail.successes.length) {
            infoStore.set(e.detail.host, {
                status: "checksEnded",
                successes: e.detail.successes,
            });
            hostsIndex.add(e.detail.host, e.detail.successes);
            badge.updateCount();
        } else {
            hostsIndex.remove(e.detail.host);
        }
    });
    detector.start();
}

run();
