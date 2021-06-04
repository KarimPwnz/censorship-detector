import { infoStore, hostsIndex, badge } from "./popup-background-common";

// Details of checks

function setBackListener(hostPage) {
    hostPage.querySelector(".to-main-menu").addEventListener("click", (e) => {
        e.preventDefault();

        // Remove current page
        let current = document.querySelector(".current");
        current.remove();

        // Redisplay main menu
        let mainMenu = document.getElementById("main-menu");
        mainMenu.classList.add("current");
        mainMenu.classList.remove("hidden");
    });
}

function addDetails(host) {
    let info = infoStore.get(host);
    let hostPageT = document.getElementById("host-page");
    let hostPage = hostPageT.content.cloneNode(true);

    // Set host name
    hostPage.querySelector(".host__name").innerText = host;

    // Set checks
    let hostPageChecks = hostPage.querySelector(".checks");
    let checkResultT = document.getElementById("check-card");
    for (let check of info.successes) {
        let checkResult = checkResultT.content.cloneNode(true);
        // Set check name
        checkResult.querySelector(".check__name").innerText = check.name;

        // Set check description
        checkResult.querySelector(".check__description").innerText =
            check.description;

        // Set check learn more
        checkResult.querySelector(".check__learn-more").href = check.learnMore;
        hostPageChecks.append(checkResult);
    }
    setBackListener(hostPage);
    document.body.append(hostPage);
}

// Blocked hosts

function arrToSummary(arr) {
    let summary = "";
    if (!arr.length) {
        return summary;
    }
    if (arr.length > 2) {
        summary += arr.slice(0, arr.length - 1).join(", ") + ", and ";
    } else if (arr.length == 2) {
        summary += arr[0] + " and ";
    }
    summary += arr[arr.length - 1];
    return summary;
}

function setSeeDetailsListener(hostSummaryCard) {
    hostSummaryCard
        .querySelector(".see-details")
        .addEventListener("click", (e) => {
            e.preventDefault();
            // Hide main menu
            let mainMenu = document.getElementById("main-menu");
            mainMenu.classList.remove("current");
            mainMenu.classList.add("hidden");

            // Add host scan details to DOM
            addDetails(e.target.dataset.host);

            // Show host scan details
            let hostPage = document.querySelector(".host-page");
            hostPage.classList.add("current");
            hostPage.classList.remove("hidden");
        });
}

function addSuccessHost(host, successes) {
    let hosts = document.querySelector(".hosts");
    let hostSummaryT = document.getElementById("host-summary-card");
    let hostSummary = hostSummaryT.content.cloneNode(1);

    // Set host name
    hostSummary.querySelector(".host__name").innerText = host;

    // Set host summary
    hostSummary.querySelector(
        ".host__summary"
    ).innerText = `This host was blocked using ${arrToSummary(successes)}.`;

    // Set see details listener
    hostSummary.querySelector(".see-details").dataset["host"] = host;
    setSeeDetailsListener(hostSummary);

    hosts.prepend(hostSummary);
}

if (!hostsIndex.isEmpty()) {
    let index = hostsIndex.index;
    document.querySelector("#main-menu .placeholder-text").remove();
    for (let [host, successes] of Object.entries(index)) {
        addSuccessHost(host, successes);
    }
    badge.reset();
}
