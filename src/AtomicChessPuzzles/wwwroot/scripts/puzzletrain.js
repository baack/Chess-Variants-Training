﻿function startWithRandomPuzzle() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            if (!jsonResponse["success"]) {
                alert("Error: " + jsonResponse["error"]);
                return;
            }
            console.log("going to setup");
            setup(jsonResponse["id"]);
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            alert("Error: status code is " + xhr.status);
            return;
        }
    }
    console.log("getting one");
    xhr.open("GET", "/Puzzle/Train/GetOneRandomly");
    xhr.send();
}

function setup(puzzleId) {
    document.getElementById("result").setAttribute("class", "");
    window.puzzleId = puzzleId;
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            if (!jsonResponse["success"]) {
                alert("Error: " + jsonResponse["error"]);
                return;
            }
            window.ground.set({
                fen: jsonResponse["fen"],
                orientation: jsonResponse["whoseTurn"],
                turnColor: jsonResponse["whoseTurn"],
                movable: {
                    free: false,
                    dests: jsonResponse["dests"]
                }
            });
            clearExplanation();
            clearComments();
            loadComments();
            document.getElementById("author").textContent = jsonResponse["author"];
            window.trainingSessionId = jsonResponse["trainingSessionId"];
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            alert("Error: status code is " + xhr.status);
            return;
        }
    }
    xhr.open("POST", "/Puzzle/Train/Setup");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send("id=" + window.puzzleId + (window.trainingSessionId ? "&trainingSessionId=" + window.trainingSessionId : ""));
}

function showExplanation(expl) {
    document.getElementById("explanation").innerHTML = expl;
}

function clearExplanation() {
    document.getElementById("explanation").innerHTML = "";
}

function submitPuzzleMove(origin, destination, metadata) {
    console.log("moved " + origin + " " + destination);
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            if (!jsonResponse["success"]) {
                alert("Error: " + jsonResponse["error"]);
                return;
            }
            window.ground.set({
                fen: jsonResponse["fen"]
            });
            if (jsonResponse["play"]) {
                var parts = jsonResponse["play"].split("-");
                window.ground.move(parts[0], parts[1]);
                window.ground.set({
                    fen: jsonResponse["fenAfterPlay"]
                });
            }
            switch (jsonResponse["correct"]) {
                case 0:
                    break;
                case 1:
                    with (document.getElementById("result")) {
                        textContent = "Success!";
                        setAttribute("class", "green");
                    };
                    break;
                case -1:
                    with (document.getElementById("result")) {
                        textContent = "Sorry, that's not correct. This was correct: " + jsonResponse["solution"];
                        setAttribute("class", "red");
                    }
            }
            if (jsonResponse["dests"]) {
                window.ground.set({
                    movable: {
                        dests: jsonResponse["dests"]
                    }
                });
            }
            if (jsonResponse["explanation"]) {
                showExplanation(jsonResponse["explanation"]);
            }
        } else if (xhr.readyState === 4 && xhr.status !== 200) {
            alert("Error: status code is " + xhr.status);
            return;
        }
    }
    xhr.open("POST", "/Puzzle/Train/SubmitMove");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send("id=" + window.puzzleId + "&trainingSessionId=" + window.trainingSessionId + "&origin=" + origin + "&destination=" + destination);
}

function submitComment(e) {
    e = e || window.event;
    e.preventDefault();
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            if (!jsonResponse["success"]) {
                alert("Error: could not post comment.");
                return;
            }
            appendComment(getUsernameFromTopbar(), jsonResponse["bodySanitized"]);
        }
    };
    xhr.open("POST", "/Puzzle/Comment/PostComment");
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send("commentBody=" + encodeURIComponent(document.getElementById("commentBody").value) + "&puzzleId=" + window.puzzleId);
}

function clearComments() {
    document.getElementById("commentContainer").innerHTML = "";
}

function appendComment(author, bodySan) {
    var p = document.createElement("p");
    p.innerHTML = "<em>" + author + ":</em> " + bodySan;
    var cmtContainer = document.getElementById("commentContainer");
    cmtContainer.insertBefore(p, cmtContainer.firstElementChild);
}

function loadComments() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            var jsonResponse = JSON.parse(xhr.responseText);
            var commentCount = jsonResponse["count"];
            if (commentCount === 0) {
                document.getElementById("commentContainer").innerHTML = "There are no comments on this puzzle.";
                return;
            }
            var commentsFromResponse = jsonResponse["comments"];
            for (var i = 0; i < commentsFromResponse.length; i++) {
                var curr = commentsFromResponse[i];
                appendComment(curr["author"], curr["body"]);
            }
        }
    };
    xhr.open("GET", "/Puzzle/Comment/GetComments?puzzleId=" + window.puzzleId);
    xhr.send();
}

window.addEventListener("load", function () {
    window.ground = Chessground(document.getElementById("chessground"), {
        coordinates: false,
        movable: {
            free: false,
            dropOff: "revert",
            showDests: false,
            events: {
                after: submitPuzzleMove
            }
        }
    });
    document.getElementById("submitCommentLink").addEventListener("click", submitComment);
    startWithRandomPuzzle();
});