// main.js
// Simple JS Racing Game (ES5)

(function() {
    // State variables
    var betCount = 0;
    var betMax = 1;
    var credits = 5000;
    var curValue = 0;
    var laneTrackPosition = 0;
    var laneTrackLengthMax = 400;
    var intervalId = null;
    var isRunning = false;

    // DOM Elements
    var elemContainer = document.getElementById("container-app-1");
    var elemLanesWrapper = document.getElementById("lanes");
    var elemMessage = document.getElementById("race-message");
    var elemWallet = document.getElementById("wallet");
    var elemSelectors = document.getElementById("selectors-wrapper");
    var elemHistory = document.getElementById("history-wrapper");
    var btnHistoryReset = document.getElementById("btn-reset-history");
    var btnRaceReset = document.getElementById("btn-reset");
    var btnRaceStart = document.getElementById("btn-start");

    // Make sure all elements exist
    if (!elemContainer || !elemLanesWrapper || !elemMessage || !elemWallet || !elemSelectors || !elemHistory || !btnRaceReset || !btnHistoryReset || !btnRaceStart) {
        alert("Some UI elements are missing. Game cannot load.");
        return;
    }

    //Competitors
    var competitors = {
        200: { color: "#000000", dark: true, name: "black" },
        100: { color: "#0000ff", dark: true,  name: "blue" },
        50: { color: "#ff0000", dark: true,  name: "red" },
        20: { color: "#ff00ff", dark: true,  name: "magenta" },
        50: { color: "#ff0000", name:"red" }, 
        20: { color: "#ff00ff", name:"magenta" }, 
        10: { color: "#00ff00", name:"green" }, 
        5: { color: "#00ffff", name:"cyan" }, 
        2: { color: "#ffff00", name:"yellow" }, 
        1: { color: "#d8d8d8", name:"white" }
    };

    // Storage Helper: Fallback for localStorage
    var storageFallback = {};
    var storage = {
        getItem: function(key) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return storageFallback[key] || null;
            }
        },
        setItem: function(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch (e) {
                storageFallback[key] = value;
            }
        },
        removeItem: function(key) {
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
        var delta = parseFloat(arrDelta[random]);
        return delta;
    }

    // Store race winner to localStorage and update UI
    function fn_history_store(val) {
        var has_history = storage.getItem("history");
        var historyBuilderString = "";
        if (has_history) {
            historyBuilderString = storage.getItem("history") + "," + val;
        } else {
            historyBuilderString = val;
        }
        storage.setItem("history", historyBuilderString);
        fn_history_ui();
    }

    // Render race history from localStorage
    function fn_history_ui() {
        var arrHistory;
        var count = {};
        var hasHistory = storage.getItem("history");
        if (hasHistory) {
            btnHistoryReset.removeAttribute("disabled");
            arrHistory = JSON.parse("[" + storage.getItem("history") + "]");
            for (var i = 0; i < arrHistory.length; i++) {
                var item = arrHistory[i];
                count[item] = (count[item] || 0) + 1;
            }
            elemHistory.innerHTML = JSON.stringify(count);
        } else {
            btnHistoryReset.setAttribute("disabled", "disabled");
            elemHistory.innerHTML = "<p>No Race History As Yet</p>";
        }
    }

    // Event Listeners for selectors and buttons
    function fn_listeners_selector() {
        btnRaceStart.addEventListener("click", fn_race_start, false);
        btnRaceReset.addEventListener("click", fn_race_reset, false);
        btnHistoryReset.addEventListener("click", fn_history_reset, false);
        var btnsLaneSelectors = elemContainer.querySelectorAll(".btn-selector");
        for (var i = 0; i < btnsLaneSelectors.length; i++) {
            btnsLaneSelectors[i].addEventListener("click", fn_race_lane, true);
        }
    }

    // Advance lane positions
    function fn_race_positions() {
        var elemLanes = elemContainer.querySelectorAll(".lane");
        for (var i = 0; i < elemLanes.length; i++) {
            var curWidth = elemLanes[i].clientWidth;
            var newLaneTrackPosition = parseInt(curWidth + (laneTrackPosition * fn_delta()), 10);
            if (curWidth < laneTrackLengthMax) {
                elemLanes[i].style.width = newLaneTrackPosition + "px";
            } else {
                var curName = elemLanes[i].getElementsByTagName('span')[0].innerHTML;
                var winnerId = elemLanes[i].getAttribute("id");
                clearInterval(intervalId);
                fn_message(winnerId, curValue, curName);
                fn_history_store(winnerId);
                break;
            }
        }
        laneTrackPosition++;
    }

    function fn_race_ready_buttons() {
        elemSelectors.classList.add("disabled");
        btnRaceStart.removeAttribute("disabled");
    }

    function fn_race_reset_buttons() {
        btnRaceStart.setAttribute("disabled", "disabled");
        btnRaceReset.setAttribute("disabled", "disabled");
        elemSelectors.classList.remove("disabled");
    }

    function fn_race_reset_lanes() {
        var elemLanes = elemContainer.querySelectorAll(".lane");
        betCount = 0;
        for (var i = 0; i < elemLanes.length; i++) {
            elemLanes[i].style.width = 0;
            elemLanes[i].classList.remove("active");
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
        var strMessageReset = "<p>Select 'Reset' to Try Again.</p>";
        var strMessageWin = "Hooray <strong class='upper'>" +
            name +
            "</strong> is the Winner! You Won <strong>" +
            val +
            "</strong> Credits.</p>" +
            strMessageReset;
        var strMessageLoss = "<strong class='upper'>" +
            name +
            "</strong> Won the Race! You Lose <strong>" + val +
            "</strong> Credits.</p>" +
            strMessageReset;
        if (winId === val) {
            elemMessage.innerHTML = strMessageWin;
            fn_wallet_ui(val);
        } else {
            elemMessage.innerHTML = strMessageLoss;
            fn_wallet_ui(-val);
        }
        btnRaceReset.removeAttribute("disabled");
    }

    function fn_race_lane() {
        if (!isRunning) {
            btnRaceReset.removeAttribute("disabled");
            if (betCount < betMax) {
                var current_pick = document.getElementById(this.name);
                current_pick.classList.add("active");
                curValue = current_pick.getAttribute("id");
                fn_race_ready_buttons();
                betCount++;
            } else {
                alert("Only 1 Bet Per Race! Select Reset to Choose Again.");
            }
        } else {
            alert("No Bets! Reset Required.");
        }
    }

    function fn_race_reset() {
        var value = parseInt(elemWallet.value, 10);
        clearInterval(intervalId);
        if (value > 0) {
            isRunning = false;
            fn_race_reset_buttons();
            fn_race_reset_lanes();
        } else {
            alert("Funds Required to Reset Race! Refresh Page to Start Again.");
        }
    }

    function fn_race_start() {
        isRunning = true;
        intervalId = setInterval(fn_race_positions, 500);
        elemMessage.innerHTML = "Race in Progress.";
        btnRaceStart.setAttribute("disabled", "disabled");
        btnRaceReset.setAttribute("disabled", "disabled");
        elemSelectors.classList.add("disabled");
    }

    function fn_race_ui() {
        var htmlLanes = "", htmlSelectors = "";
        for (var x in competitors) {
            if (competitors.hasOwnProperty(x)) {
                var strClass;
                if (competitors[x]['dark'] === true) {
                    strClass = "dark";
                } else {
                    strClass = "";
                }
                htmlLanes += '<div style="background-color: ' + competitors[x]['color'] + '" id="' + x + '" class="lane '+strClass+'"><span>' + competitors[x]['name'] + '</span></div>';
                htmlSelectors += '<button style="background-color: ' + competitors[x]['color'] + '" name="' + x + '" class="btn-selector '+strClass+'">' + x + '<sup>c</sup></button>';
            }
        }
        elemLanesWrapper.innerHTML = htmlLanes;
        elemSelectors.innerHTML = htmlSelectors;
    }

    function fn_update_ui() {
        elemWallet.value = credits;
        fn_race_ui();
        fn_history_ui();
        fn_listeners_selector();
    }

    function fn_wallet_ui(val) {
        if (elemWallet.disabled) {
            var value = parseInt(elemWallet.value, 10);
            value += parseInt(val, 10);
            elemWallet.value = value;
        } else {
            alert("No Bottomless Wallet Attempts! Click Browser Refresh to Start Again.");
        }
    }

    window.onload = function() {
        if (elemContainer) {
            fn_update_ui();
        } 
    };
})();
