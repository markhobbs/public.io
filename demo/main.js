// main.js
// Simple JS Racing Game

(function () {
    // State variables
    var betCount = 0;
    var betMax = 1;
    var credits = 5000;
    var curValue = 0;
    var fairyLightsTimeout = null
    var hasFairyLights = true;
    var laneStartPosition = 2;
    var laneMaxLength = 300;
    var autoResetTimeout = null;
    var isRunning = false;
    var timeAutoReset = 5; // seconds
    var timeFairyLight = 0.3 // seconds
    var cachedLanes = [];
    var cachedSelectors = [];

    // DOM Elements
    var elemContainer = document.getElementById('container-app-1');
    var elemHistory = document.getElementById('history');
    var elemLanes = document.getElementById('lanes');
    var elemMessage = document.getElementById('message');
    var elemSelectors = document.getElementById('selectors');
    var elemWallet = document.getElementById('wallet');
    var btnHistoryReset = document.getElementById('btn-reset-history');
    var btnRaceReset = document.getElementById('btn-reset');
    var btnRaceStart = document.getElementById('btn-start');
    var elemTrack = elemContainer ? elemContainer.getElementsByClassName('track') : [];

    // Ensure all elements exist
    if (!elemContainer || !elemLanes || !elemMessage || !elemWallet || !elemSelectors || !elemHistory || !btnRaceReset || !btnHistoryReset || !btnRaceStart) {
        alert("Some UI elements are missing. Game cannot load.");
        return;
    }

    // Competitors Array
    var competitors = [
        { id: 200, color: "#000000", dark: true, name: "black" },
        { id: 100, color: "#0000ff", dark: true, name: "blue" },
        { id: 50, color: "#ff0000", dark: false, name: "red" },
        { id: 20, color: "#ff00ff", dark: false, name: "magenta" },
        { id: 10, color: "#00ff00", dark: false, name: "green" },
        { id: 5, color: "#00ffff", dark: false, name: "cyan" },
        { id: 2, color: "#ffff00", dark: false, name: "yellow" },
        { id: 1, color: "#d8d8d8", dark: false, name: "white" }
    ];

    // Storage Helper: Fallback for localStorage
    var storageFallback = {};
    var storage = {
        getItem: function (key) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return storageFallback[key] || null;
            }
        },
        setItem: function (key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                storageFallback[key] = value;
            }
        },
        removeItem: function (key) {
            try {
                window.localStorage.removeItem(key);
            } catch (e) {
                delete storageFallback[key];
            }
        }
    };

    // Helper: Random delta for lane progress
    function fn_delta() {
        var arrDelta = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2];
        var random = Math.floor(Math.random() * arrDelta.length);
        return arrDelta[random];
    }

    function fn_get_random_int(max) {
        return Math.floor(Math.random() * max);
    }

    // Store race winner to localStorage and update UI
    function fn_history_store(val) {
        var hasHistory = storage.getItem("history");
        var historyBuilderString = hasHistory ? hasHistory + "," + val : val;
        storage.setItem("history", historyBuilderString);
        fn_history_ui();
    }

    // Render race history from localStorage
    function fn_history_ui() {
        var hasHistory = storage.getItem("history");
        if (hasHistory) {
            btnHistoryReset.removeAttribute("disabled");
            var arrHistory = hasHistory.split(",");
            var count = {};
            for (var i = 0; i < arrHistory.length; i++) {
                var item = arrHistory[i];
                count[item] = (count[item] || 0) + 1;
            }
            elemHistory.innerHTML = "<pre>" + JSON.stringify(count, null, 2) + "</pre>";
        } else {
            btnHistoryReset.setAttribute("disabled", "disabled");
            elemHistory.innerHTML = "<p>No Race History As Yet</p>";
        }
    }

    // Event Listeners for selectors and buttons
    function fn_listeners_selector() {
        // Attach once
        btnRaceStart.addEventListener("click", fn_race_start, false);
        btnRaceReset.addEventListener("click", fn_race_reset, false);
        btnHistoryReset.addEventListener("click", fn_history_reset, false);
    }

    // Attach lane selector listeners (after rendering selectors)
    function fn_listeners_lane_selectors() {
        for (var i = 0; i < cachedSelectors.length; i++) {
            cachedSelectors[i].addEventListener("click", fn_race_lane, false);
        }
    }

    // Advance lane positions using requestAnimationFrame
    function fn_race_positions() {
        if (!isRunning) return;
        var winnerIndex = -1;
        for (var i = 0; i < cachedLanes.length; i++) {
            var lane = cachedLanes[i];
            var curWidth = lane.offsetWidth;
            var laneStartPositionDup = laneStartPosition;
            var newlaneStartPosition = Math.floor(curWidth + (laneStartPositionDup * fn_delta()));
            if (curWidth < laneMaxLength) {
                lane.style.width = newlaneStartPosition + "px";
            } else if (winnerIndex === -1) {
                winnerIndex = i;
            }
        }
        laneStartPositionDup++;
        if (winnerIndex > -1) {
            // Race finished
            if (hasFairyLights) {
                for (var i = 0; i < cachedSelectors.length; i++) {
                    cachedSelectors[i].classList.remove("winner", "loser");
                    cachedSelectors[i].disabled = false;
                }
                clearTimeout(fairyLightsTimeout);
            }
            var winnerLane = cachedLanes[winnerIndex];
            var curName = winnerLane.getElementsByTagName('span')[0].innerHTML;
            var winnerId = winnerLane.getAttribute("id");
            isRunning = false;
            fn_message(winnerId, curValue, curName);
            fn_history_store(winnerId);
            btnRaceReset.focus();
        } else {
            window.requestAnimationFrame(fn_race_positions);
        }
    }

    function fn_race_ready_buttons() {
        for (var i = 0; i < cachedSelectors.length; i++) {
            cachedSelectors[i].disabled = true;
        }
        btnRaceStart.removeAttribute("disabled");
    }
    function fn_race_reset_buttons() {
        for (var i = 0; i < cachedSelectors.length; i++) {
            cachedSelectors[i].classList.remove("active", "winner", "loser");
            cachedSelectors[i].disabled = false;
        }
        btnRaceStart.setAttribute("disabled", "disabled");
        btnRaceReset.setAttribute("disabled", "disabled");
    }

    function fn_race_reset_lanes() {
        betCount = 0;
        for (var i = 0; i < cachedLanes.length; i++) {
            cachedLanes[i].style.width = laneStartPosition + "px";
            cachedLanes[i].classList.remove("active");
        }
    }

    function fn_history_reset() {
        var text = "Are You Sure? This Action Will Delete All Race History.";
        if (confirm(text)) {
            storage.removeItem("history");
            fn_history_ui();
        }
    }

    function fn_message(winId, val, name) {
        var strMessageReset = "<p>Resetting Race in " + timeAutoReset + " seconds.</p>";
        var strMessageWin = "Hooray <strong class='upper'>" +
            name +
            "</strong> is the Winner! You Won <strong>" +
            val +
            "</strong> Credits.</p>" +
            strMessageReset;
        var strMessageLoss = "<strong class='upper'>" +
            name +
            "</strong> is the Winner! You Lose <strong>" + val +
            "</strong> Credits.</p>" +
            strMessageReset;
        if (winId === val) {
            elemMessage.innerHTML = strMessageWin;
            fn_wallet_ui(val);
        } else {
            elemMessage.innerHTML = strMessageLoss;
            fn_wallet_ui(-val);
        }
        fn_selector_highlight_winner(winId);
        btnRaceReset.removeAttribute("disabled");
        // Use setTimeout for auto-reset (not setInterval)
        if (autoResetTimeout) clearTimeout(autoResetTimeout);
        autoResetTimeout = setTimeout(fn_race_reset, timeAutoReset * 1000);
    }

    function fn_race_lane(e) {
        if (isRunning) {
            alert("No Bets Please! Race in Progress.");
            return;
        }
        btnRaceReset.removeAttribute("disabled");
        if (betCount < betMax) {
            var current_pick = document.getElementById(this.name);
            current_pick.classList.add("active");
            curValue = current_pick.getAttribute("id");
            fn_race_ready_buttons();
            this.classList.add("active");
            betCount++;
        } else {
            alert("Only 1 Bet Per Race! Select Reset to Choose Again.");
        }
    }

    function fn_race_reset() {
        isRunning = false;
        if (autoResetTimeout) clearTimeout(autoResetTimeout);
        if (fairyLightsTimeout) clearTimeout(fairyLightsTimeout);
        elemMessage.innerHTML = "";
        var value = parseInt(elemWallet.value, 10);
        if (value > 0) {
            fn_race_reset_buttons();
            fn_race_reset_lanes();
        } else {
            alert("Funds Required to Reset Race! Refresh Page to Start Again.");
        }
    }

    function fn_race_start() {
        isRunning = true;
        laneMaxLength = elemTrack[0].clientWidth;
        cachedLanes = elemContainer.querySelectorAll(".lane");
        window.requestAnimationFrame(fn_race_positions);
        elemMessage.innerHTML = "No Bets Please! Race in Progress.";
        btnRaceStart.setAttribute("disabled", "disabled");
        btnRaceReset.setAttribute("disabled", "disabled");
        if (hasFairyLights) {
            fairyLightsTimeout = setInterval(fn_fairy_lights_alt1, parseInt(timeFairyLight * 1000));
        }
    }

    function fn_fairy_lights_alt1() {
        if (cachedSelectors.length < 2) return;
        var rand1 = fn_get_random_int(cachedSelectors.length);
        var rand2;
        do {rand2 = fn_get_random_int(cachedSelectors.length)} while (rand2 === rand1);

        for (var i = 0; i < cachedSelectors.length; i++) {
            cachedSelectors[i].classList.remove("winner", "loser");
        }
        cachedSelectors[rand1].classList.add("loser");
        cachedSelectors[rand2].classList.add("winner");
    }

    function fn_fairy_lights_alt2() {
        for (var i = 0; i < cachedSelectors.length; i++) {
            cachedSelectors[i].classList.remove("winner", "loser");
            if (Math.random() < 0.5) {
                cachedSelectors[i].classList.add("winner");
            } else {
                cachedSelectors[i].classList.add("loser");
            }
        }
    }

    function fn_race_ui() {
        var htmlLanes = "", htmlSelectors = "";
        for (var i = 0; i < competitors.length; i++) {
            var comp = competitors[i];
            var strClass = comp.dark ? "dark" : "";
            htmlLanes += '<div style="background-color: ' + comp.color + '" id="' + comp.id + '" class="lane ' + strClass + '"><span>' + comp.name + '</span></div>';
            htmlSelectors += '<button style="background-color: ' + comp.color + '" name="' + comp.id + '" class="btn-selector ' + strClass + '">' + comp.id + '<sup>c</sup></button>';
        }
        elemLanes.innerHTML = htmlLanes;
        elemSelectors.innerHTML = htmlSelectors;
        cachedLanes = elemContainer.querySelectorAll(".lane");
        cachedSelectors = elemContainer.querySelectorAll(".btn-selector");
        fn_listeners_lane_selectors();
    }

    function fn_selector_highlight_winner(val) {
        for (var i = 0; i < cachedSelectors.length; i++) {
            if (cachedSelectors[i].name === val) {
                cachedSelectors[i].classList.add("winner");
            } else {
                cachedSelectors[i].classList.add("loser");
            }
        }
    }

    function fn_update_ui() {
        elemWallet.value = credits;
        fn_race_ui();
        fn_history_ui();
        fn_listeners_selector();
    }

    function fn_wallet_ui(val) {
        var value = parseInt(elemWallet.value, 10);
        value += parseInt(val, 10);
        elemWallet.value = value;
    }

    window.onload = function () {
        fn_update_ui();
        fn_race_reset_buttons();
    };

})();
