// main.js
//
// Simple JS Racing Game
//

(function() {

    //Variables
    var betCount = 0;
    var betMax = 1;
    var credits = 10000;
    var creditsPerGame = 100;
    var currentPickValue = 0;
    var laneTrackPosition = 0;
    var laneTrackLengthMax = 400;
    var intervalId = null;
    var isRunning = false;

    //Register Elements
    var btnResetRace = document.getElementById("btn-reset");
    var btnResetRaceHistory = document.getElementById(
        "btn-reset-history");
    var btnStartRace = document.getElementById("btn-start");
    var btnsLaneSelectors = document.querySelectorAll(
        ".btn-selector");
    var elemLanes = document.querySelectorAll(".lane");
    var elemMessageHistory = document.getElementById(
        "race-message");
    var elemWallet = document.getElementById("wallet");
    var elemWrapperLaneSelector = document.getElementById(
        "selector-wrapper");
    var elemWrapperHistory = document.getElementById(
        "history-wrapper");

    //Register Listeners
    var fn_register_selector_listeners = function() {
        //Register Listeners for lane selectors
        for (var i = btnsLaneSelectors.length; i--;) {
            btnsLaneSelectors[i].addEventListener("click",
                fn_select_lane,
                false);
        }
    };
    btnStartRace.addEventListener("click", fn_start_race, false);
    btnResetRace.addEventListener("click", fn_reset_race, false);
    btnResetRaceHistory.addEventListener("click", fn_del_history,
        false);

    var fn_get_delta = function() {
        //Plug Random Modifier Into Element Lengths
        var arrDelta = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1,
            2
        ];
        var random = Math.floor(Math.random() * arrDelta
            .length);
        var delta = parseFloat(arrDelta[random]);
        return delta;
    };

    function updateWalletCredits(val) {
        var value = parseInt(elemWallet.value);
        value += parseInt(val);
        elemWallet.value = value;
    }

    var fn_update_lane_position = function() {
        var newLaneTrackPosition = laneTrackPosition + "px";

        for (var i = elemLanes.length; i--;) {
            var curWidth = elemLanes[i].clientWidth;
            newLaneTrackPosition = curWidth + (
                laneTrackPosition *
                fn_get_delta());

            if (curWidth < laneTrackLengthMax) {
                //Increase width of lane if less than the track width
                elemLanes[i].style.width =
                    newLaneTrackPosition + "px";
            } else {

                //Else one lane has hit the finish line width 
                var winnerId = elemLanes[i].getAttribute(
                "id");

                //Clear Game Interval and Update Messaging
                clearInterval(intervalId);
                fn_message_race_finish(winnerId,
                    currentPickValue);
                fn_reset_races_history(winnerId);
                break;
            }
        }
        laneTrackPosition++;
    };


    function fn_message_race_finish(winId, val) {
        var strMessageReset = "<p>Select 'Reset' to try again.</p>";
        var strHistoryMessageWin = "Hooray <strong>" +
            val +
            "</strong> Won! <strong>" +
            creditsPerGame +
            "</strong> credits added to your wallet.</p>" +
            strMessageReset;

        var strHistoryMessageLoss = "Sorry <strong>" +
            val +
            "</strong> Lost! <strong>" + winId +
            "</strong> won the race. <strong>" +
            creditsPerGame +
            "</strong> credits taken from your wallet.</p>" +
            strMessageReset;

        //Is Winner? Update Credits and History
        if (winId === val) {
            elemMessageHistory.innerHTML =
                strHistoryMessageWin;
            updateWalletCredits(creditsPerGame);
        } else {
            elemMessageHistory.innerHTML =
                strHistoryMessageLoss;
            updateWalletCredits(-creditsPerGame);
        }
    }

    function fn_select_lane() {
        if (!isRunning) {
            btnResetRace.removeAttribute("disabled");
            if (betCount < betMax) {
                var current_pick = document.getElementById(this
                    .name);
                current_pick.classList.add("active");
                currentPickValue = current_pick.getAttribute(
                    "id");

                //Rest Race Button Sattes
                fn_ready_race_buttons();

                betCount++;
            } else {
                alert(
                    "Max 1 bet(s) exceeded! Select 'Reset' to choose again."
                    );
            }
        } else {
            alert(
                "No bets while game is in progress! Select 'Reset' to choose again."
            );
        }
    }

    var fn_update_races_history_ui = function() {
        var hasHistory = localStorage.getItem("history");
        if (hasHistory) {
            btnResetRaceHistory.removeAttribute("disabled");
            var arrHistory = JSON.parse("[" + localStorage.getItem("history") + "]");
            var count = {};
            arrHistory.forEach(function(i) { count[i] = (count[i]||0) + 1;});
            elemWrapperHistory.innerHTML = JSON.stringify(count);
        } else {
            btnResetRaceHistory.setAttribute("disabled",
                "disabled");
            elemWrapperHistory.innerHTML =
                "<p>History Empty</p>";
        }
    };

    var fn_reset_races_history = function(val) {
        var has_history = localStorage.getItem("history");
        var historyBuilderString = "";
        if (has_history) {
            historyBuilderString = localStorage.getItem(
                "history") + "," + val;
        } else {
            historyBuilderString = val;
        }
        //Store Winner History Value and update the History UI
        localStorage.setItem("history", historyBuilderString);
        fn_update_races_history_ui();
    };

    var fn_ready_race_buttons = function() {
        //Ready button ready status
        elemWrapperLaneSelector.classList.add("disabled");
        btnStartRace.removeAttribute("disabled", "disabled");
    };

    var fn_reset_race_buttons = function() {
        //Reset button disabled status
        btnStartRace.setAttribute("disabled", "disabled");
        btnResetRace.setAttribute("disabled", "disabled");
        elemWrapperLaneSelector.classList.remove("disabled");
    };

    var fn_reset_race_lanes = function() {
        //Reset Counts
        betCount = 0;
        //Reset Element Positions
        for (var i = elemLanes.length; i--;) {
            elemLanes[i].style.width = 0;
            elemLanes[i].classList.remove("active");
        }
    };

    function fn_start_race() {
        isRunning = true;

        //Increment lane position each tick
        intervalId = setInterval(fn_update_lane_position, 500);

        elemMessageHistory.innerHTML = "Race in progress.";
        btnStartRace.setAttribute("disabled", "disabled");
        elemWrapperLaneSelector.classList.add("disabled");
    }

    function fn_reset_race() {
        //Reset the race to its original state
        isRunning = false;
        clearInterval(intervalId);
        fn_reset_race_buttons();
        fn_reset_race_lanes();
    }

    function fn_del_history() {
        var text =
            "Are you sure? This action will delete all race history.";
        if (confirm(text) == true) {
            localStorage.removeItem("history");
            fn_update_races_history_ui();
        }
    }

    window.onload = function() {
        fn_register_selector_listeners();
        fn_update_races_history_ui();
        elemWallet.value = credits;
    };

})();