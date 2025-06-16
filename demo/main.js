// main.js
//
// Simple JS Racing Game 
/* 
    Spectrum Colors
    #000000
    #0000d8
    #0000ff
    #d80000
    #ff0000
    #d800d8
    #ff00ff
    #00d800
    #00ff00
    #00d8d8
    #00ffff
    #d8d800
    #ffff00
    #d8d8d8
    #ffffff
*/
//

(function() {
    //Variables
    var betCount = 0;
    var betMax = 1;
    var competitorsJSON = '{ "200":{"color":"#000000", "name":"black"}, "100":{"color":"#0000ff", "name":"blue"}, "50": {"color":"#ff0000", "name":"red"}, "20":{"color":"#ff00ff", "name":"magenta"}, "10":{"color":"#00ff00", "name":"green"}, "5":{"color":"#00ffff", "name":"cyan"}, "2":{"color":"#ffff00", "name":"yellow"}, "1":{"color":"#d8d8d8", "name":"white"} }';
    var credits = 5000;
    var curValue = 0;
    var laneTrackPosition = 0;
    var laneTrackLengthMax = 400;
    var intervalId = null;
    var isRunning = false;
    var elemContainer = document.getElementById("container-app-1");
    var elemLanesWrapper = document.getElementById("lanes");
    var elemHistoryMessage = document.getElementById("race-message");
    var elemWallet = document.getElementById("wallet");
    var elemSelectors = document.getElementById("selectors-wrapper");
    var elemWrapperHistory = document.getElementById("history-wrapper");
    var btnRaceReset = document.getElementById("btn-reset");
    var btnHistoryReset = document.getElementById("btn-reset-history");
    var btnRaceStart = document.getElementById("btn-start");
    
    var fn_delta = function() {
        //Plug Random Modifier Into Element Lengths
        var arrDelta = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1, 2];
        var random = Math.floor(Math.random() * arrDelta.length);
        var delta = parseFloat(arrDelta[random]);
        return delta;
    };

    var fn_history_store = function(val) {
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
        fn_history_ui();
    };

    var fn_history_ui = function() {
        var arrHistory;
        var count = {};
        var hasHistory = localStorage.getItem("history");
        if (hasHistory) {
            btnHistoryReset.removeAttribute("disabled");
            arrHistory = JSON.parse("[" + localStorage.getItem("history") + "]");
            arrHistory.forEach(function(i) { count[i] = (count[i]||0) + 1;});
            elemWrapperHistory.innerHTML = JSON.stringify(count);
        } else {
            btnHistoryReset.setAttribute("disabled",
                "disabled");
            elemWrapperHistory.innerHTML =
                "<p>No Race History As Yet</p>";
        }
    };

    var fn_listeners_selector = function() {
        //Register Listeners
        btnRaceStart.addEventListener("click", fn_race_start, false);
        btnRaceReset.addEventListener("click", fn_race_reset, false);
        btnHistoryReset.addEventListener("click", fn_history_reset, false);
        var btnsLaneSelectors = elemContainer.querySelectorAll(".btn-selector");
        for (var i = btnsLaneSelectors.length; i--;) {
            btnsLaneSelectors[i].addEventListener("click", fn_race_lane, true);
        }
    };

    var fn_race_positions = function() {
        var elemLanes = elemContainer.querySelectorAll(".lane");
        var newLaneTrackPosition = laneTrackPosition + "px";
        for (var i = elemLanes.length; i--;) {
            var curWidth = elemLanes[i].clientWidth;
            //newLaneTrackPosition = curWidth + (laneTrackPosition * fn_delta());
            newLaneTrackPosition = parseInt(curWidth + (laneTrackPosition * fn_delta()));
            if (curWidth < laneTrackLengthMax) {
                //Increase width of lane if less than the track width
                elemLanes[i].style.width = newLaneTrackPosition + "px";
            } else {
                var curName = elemLanes[i].getElementsByTagName('span')[0].innerHTML;
                //Else one lane has hit the finish line width 
                var winnerId = elemLanes[i].getAttribute("id");
                //Clear Game Interval and Update Messaging
                clearInterval(intervalId);
                fn_message(winnerId, curValue, curName);
                fn_history_store(winnerId);
                break;
            }
        }
        laneTrackPosition++;
    };

    var fn_race_ready_buttons = function() {
        //Ready button ready status
        elemSelectors.classList.add("disabled");
        btnRaceStart.removeAttribute("disabled", "disabled");
    };

    var fn_race_reset_buttons = function() {
        //Reset button disabled status
        btnRaceStart.setAttribute("disabled", "disabled");
        btnRaceReset.setAttribute("disabled", "disabled");
        elemSelectors.classList.remove("disabled");
    };

    var fn_race_reset_lanes = function() {
        var elemLanes = elemContainer.querySelectorAll(".lane");
        //Reset Counts
        betCount = 0;
        //Reset Element Positions
        for (var i = elemLanes.length; i--;) {
            elemLanes[i].style.width = 0;
            elemLanes[i].classList.remove("active");
        }
    };

    function fn_history_reset() {
        var text =
            "Are You Sure? This Action Will Delete All Race History.";
        if (confirm(text) == true) {
            localStorage.removeItem("history");
            fn_history_ui();
        }
    }

    function fn_message(winId, val, name) {
        var strMessageReset = "<p>Select 'Reset' to Try Again.</p>";
        var strHistoryMessageWin = "Hooray <strong>" +
            name +
            "</strong> is the Winner! You Won <strong>" +
            val +
            "</strong> Credits.</p>" +
            strMessageReset;
        var strHistoryMessageLoss = "Sorry <strong>" +
            name +
            "</strong> Won the Race! You Lose <strong>" + val +
            "</strong> Credits.</p>" +
            strMessageReset;
        //Is Winner? Update Credits and History
        if (winId === val) {
            elemHistoryMessage.innerHTML = strHistoryMessageWin;
            fn_wallet_ui(val);
        } else {
            elemHistoryMessage.innerHTML = strHistoryMessageLoss;
            fn_wallet_ui(-val);
        }
    }

    function fn_race_lane() {
        // Add your logic here…
        if (!isRunning) {
            btnRaceReset.removeAttribute("disabled");
            if (betCount < betMax) {
                var current_pick = document.getElementById(this
                    .name);
                current_pick.classList.add("active");
                curValue = current_pick.getAttribute(
                    "id");
                //Rest Race Button Sattes
                fn_race_ready_buttons();
                betCount++;
            } else {
                alert("Max 1 bet(s) exceeded! Select Reset to Choose Again.");
            }
        } else {
            alert(
                "No bets please! Race is in progress. Click Reset to reset the race."
            );
        }
    }

    function fn_race_reset() {
        //Check user has funds
        var value = parseInt(elemWallet.value);
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
        //Increment lane position each tick
        intervalId = setInterval(fn_race_positions, 500);
        elemHistoryMessage.innerHTML = "Race in Progress.";
        btnRaceStart.setAttribute("disabled", "disabled");
        elemSelectors.classList.add("disabled");
    }

    function fn_race_ui() {
        //Generate HTML for populating track lanes and track selector buttons. 
        const myObj = JSON.parse(competitorsJSON);
        let htmlLanes = "", htmlSelectors = "";
        for (const x in myObj) {
            //text += myObj[x] + ", ";
            htmlLanes += `<div 
                style="background-color: ${myObj[x]['color']}"
                id=${x} 
                class="lane">
                    <span>${myObj[x]['name']}</span>
                </div>`;
            htmlSelectors += `<button
                style="background-color: ${myObj[x]['color']}" 
                name=${x} 
                class="btn-selector">
                ${x}<sup>c</sup> 
                </button>`;
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
        //Check Input Not Updated
        if (elemWallet.disabled) {
            var value = parseInt(elemWallet.value);
            value += parseInt(val);
            elemWallet.value = value;
        } else {
            alert("No Bottomless Wallet Attempts! Click Browser Refresh to Start Again.")
        }
    }

    window.onload = function() {
        if (elemContainer) {
            fn_update_ui();
        } else {
            alert("Unable to Install Game")
        }
    };
})();
