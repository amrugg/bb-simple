var mode = "wait";
var header = document.getElementById("question");
var activeQuestion;
var index = -1;
var strikes = 0;
var score = 0;
var strikeContainer = document.getElementById("strikes");
var buttons = [];
var timeEvent;
var activeSet;
var fullSet;
var buttonContainer = document.getElementById("button-container");
var curQuestion;
var optionDiv = document.getElementById("options");
var gameModes = {
    "Buzzer": {
        begin: function() {
            yesButton = document.createElement("button");
            yesButton.style.backgroundColor = "#4EB31B";
            yesButton.addEventListener("click", correct);
            yesButton.textContent = "Knew";
            yesButton.style.display = "none";
        
            noButton = document.createElement("button");
            noButton.style.backgroundColor = "#9B2318";
            noButton.addEventListener("click", incorrect);
            noButton.textContent = "Didn't know";
            noButton.style.display = "none";
        
            buttonContainer.appendChild(yesButton);
            buttonContainer.appendChild(noButton);
            if(shouldShuffle) {
                shuffle(activeSet);
            }
            index = -1;
            strikes = 0;
            score = 0;
            curGame.askQuestion();
        },
        askQuestion: function () {
            if(activeSet.length) {
                mode = "read";
                yesButton.style.display = "none";
                noButton.style.display = "none";
                header.textContent = "";
                var random = Math.floor(Math.random() * activeSet.length);
                curQuestion = activeSet[random];
                curQuestion.i = random;
                readIndex = 0;
                readInt = setInterval(read, speed);
            } else {
                win();
            }
        }
    },
    "Multiple Choice": {
        choices: 4,
        begin: function() {
            curGame.choices = Math.min(activeSet.length, 4);
            for(var i = 0; i < curGame.choices; ++i) {
                var button = document.createElement("button");
                button.className = "button" + i;
                buttonContainer.appendChild(button);
                buttons.push(button);
                arm(button, i);
            }
            function arm(button, i) {
                button.addEventListener("click", function() {
                    curGame.answer(i);
                });
            }
            fullSet = activeSet.slice();
            if(shouldShuffle) {
                shuffle(activeSet);
            }
            index = -1;
            strikes = 0;
            score = 0;
            curGame.askQuestion();
        },
        askQuestion: function () {
            if(activeSet.length) {
                var random = Math.floor(Math.random() * activeSet.length);
                curQuestion = activeSet[random];
                mode = "answer";
                var choices = generateChoices(fullSet, curGame.choices, curQuestion.a);
                buttons.forEach(function(b, i) {
                    b.textContent = choices.choices[i];
                });
                curGame.ansI = choices.ansI;
                header.textContent = curQuestion.q;
            } else {
                win();
            }
        },
        answer: function (i) {
            if(mode !== "answer") {
                return;
            }
            setTimeout(function() {
                if(curGame.ansI === i) {
                    correct();
                } else {
                    incorrect();
                }
                buttons.forEach(function(b) {
                    b.classList.remove("green");
                    b.classList.remove("red");
                });
                mode = "answer";
            },500);
            mode = "anim";
            buttons.forEach(function(b,index){
                if(curGame.ansI === index) {
                    b.classList.add("green");
                } else {
                    b.classList.add("red");
                }
            });
        }
    }
};
var questionSets;
function loadFilesFromSetsFolder() {
    var filesObject = {};
    var filesIndex = 0;
    var fileNames = ["cats", "churches", "crs-ai", "crs-me", "fp-chapter-content", "general", "isaiah60", "place-names", "rapid-fire", "titles", "whereis"]; // Replace with actual file names
    
    function loadNextFile() {
        if (filesIndex >= fileNames.length) {
            console.log("All files loaded:", filesObject);
            questionSets = filesObject;
            Object.keys(questionSets).forEach(function(key) {
                var op = document.createElement("option");
                op.textContent = key;
                setSelect.appendChild(op);
            });
            return;
        }

        var filePath = "sets/" + fileNames[filesIndex];
        var xhr = new XMLHttpRequest();
        
        xhr.open("GET", filePath, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    filesObject[fileNames[filesIndex]] = xhr.responseText;
                } else {
                    console.error("Failed to load file: " + filePath);
                }
                filesIndex++;
                loadNextFile();
            }
        };
        xhr.send();
    }
    loadNextFile();
}
var modes = [
    "Buzzer",
    // "Learn",
    "Multiple Choice",
    // "Rapid Rush"
];
var curMode = "Buzzer";
var curGame;
var reverse = false;
var shouldShuffle = true;
var readInt;
var yesButton;
var noButton;
var threshold = 2;
var strikeThreshold = 2;
var fallibleJudge = true;
var fallibleWait = 250;
var fallibleTimeout;
var errorSet = [];
var setSelect;
function loadPage() {
    loadOptions();
    loadFilesFromSetsFolder();
    header.textContent = "Paste to Begin";
}
function loadOptions() {
    setSelect = document.createElement("select");
    var paste = document.createElement("option");
    paste.textContent = "Paste";
    setSelect.appendChild(paste);
    setSelect.addEventListener("input", function() {
        if(setSelect.selectedIndex !== 0) {
            if(!parseSet(questionSets[setSelect.value])) {
                console.log(questionSets[setSelect.value]);
            }
        }
    });
    optionDiv.appendChild(setSelect);
    optionDiv.appendChild(document.createElement("br"));

    var modeSelect = document.createElement("select");
    modes.forEach(function(cur) {
        var op = document.createElement("option");
        op.textContent = cur;
        modeSelect.appendChild(op)
    });
    modeSelect.addEventListener("input", function() {
        curMode = modes[modeSelect.selectedIndex];
    })
    optionDiv.appendChild(modeSelect);
    optionDiv.appendChild(ctxt("span", "Reverse: "));
    var reverseBox = document.createElement("input");
    reverseBox.type = "checkbox";
    reverseBox.addEventListener("input", function() {
        reverse = reverseBox.checked;
    });
    optionDiv.appendChild(reverseBox);
    optionDiv.appendChild(document.createElement("br"));

    optionDiv.appendChild(ctxt("span", "Shuffle: "));
    var shuffleBox = document.createElement("input");
    shuffleBox.type = "checkbox";
    shuffleBox.checked = true;
    shuffleBox.addEventListener("input", function() {
        shouldShuffle = shuffleBox.checked;
    });
    optionDiv.appendChild(shuffleBox);


    optionDiv.appendChild(document.createElement("br"));
    optionDiv.appendChild(ctxt("span", "Win Threshold: "));
    var thresholdI = document.createElement("input");
    thresholdI.type = "number";
    thresholdI.style.width = "3em";
    thresholdI.value = 2;
    thresholdI.addEventListener("input", function() {
        threshold = parseInt(thresholdI.value);
    });
    optionDiv.appendChild(thresholdI);
    optionDiv.appendChild(document.createElement("br"));

    optionDiv.appendChild(ctxt("span", "Fallible Judges: "));
    var fallibleBox = document.createElement("input");
    fallibleBox.type = "checkbox";
    fallibleBox.checked = true;
    fallibleBox.addEventListener("input", function() {
        fallibleJudge = fallibleBox.checked;
    });
    optionDiv.appendChild(fallibleBox);
    
}
function ctxt(title, txt) {
    var el = document.createElement(title);
    el.textContent = txt;
    return el;
}
function win() {

}
function startGame() {
    curGame = gameModes[curMode];
    curGame.begin();
}
var speed = 75;
var readIndex = 0;
function randArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function read() {
    if(readIndex >= curQuestion.q.length) {
        clearInterval(readInt);
        return;
    }
    header.textContent += curQuestion.q[readIndex++];
}
function buzz() {
    if(mode === "read") {
        if(fallibleJudge && !fallibleTimeout) {
            var fallibleTimeout = setTimeout(buzzIn, fallibleWait);
        } else {
            buzzIn();
        }
    } else if(mode === "think") {
        showAns();
    } else if(mode === "y/n") {
        correct();
    }
}
function buzzIn() {
    fallibleTimeout = false;
    mode = "think"
    clearInterval(readInt);
    startCountDown();
}
function correct() {
    if(curQuestion.score) {
        curQuestion.score++;
    } else {
        curQuestion.score = 1;
    }
    if(curQuestion.score >= threshold) {
        for(var i = 0; i < activeSet.length; i++) {
            if(activeSet[i] === curQuestion) {
                activeSet.splice(i,1);
                break;
            }
        }
    }
    curGame.askQuestion();
}
function incorrect() {
    if(curQuestion.score) {
        curQuestion.score--;
    } else {
        curQuestion.score = 0;
    }

    if(curQuestion.strikes) {
        curQuestion.strikes++;
        if(curQuestion.strikes > strikeThreshold) {
            errorSet.push(curQuestion);
        }
    } else {
        curQuestion.strikes = 1;
    }
    curGame.askQuestion();
}
function startCountDown() {
    var timerIndex = 5;
    header.textContent = timerIndex + "...";

    readInt = setInterval(function() {
        if(--timerIndex) {
            header.textContent = timerIndex + "...";
        } else {
            showAns();
        }
    }, 1000);
}
function showAns() {
    header.textContent = curQuestion.a;
    mode = "y/n";
    clearInterval(readInt);
    yesButton.style.display = "";
    noButton.style.display = "";
}
addEventListener("keydown", function(e) {
    if(e.key === " ") {
        buzz();
    } else if (e.code === "KeyY" && mode === "y/n") {
        correct();
    } else if (e.code === "KeyN" && mode === "y/n") {
        incorrect();
    }
});
addEventListener("click", function(e) {
    if(e.key === " ") {
        buzz();
    }
});
addEventListener("paste", onPaste);
function onPaste(e) {
    text = e.clipboardData.getData("text/plain").trim();
    parseSet(text);
}
function parseSet(text) {
    if(text[0] === "[") {
        var newSet = JSON.parse(text);
        activeSet = splitJSON(newSet);
        scores = [];
        startGame();
        return;
    }
    text = text.replace(/\t/gi, "|");
    text = text.replace(/\[/gi,"");
    text = text.replace(/\]/gi,"");

    text = text.split("\n");
    if(text[0].indexOf("|") > -1) {
        activeSet = split(text);
        scores = [];
        startGame();
        return true;
    } else {
        header.textContent = "Could not parse";
        console.log(text);
        return false;
    }
}
function split(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(arr[i].indexOf("|") < 1) {
            continue;
        }
        var cur = arr[i].split("|");
        if(reverse) {
            set.push({q: cur[1], a: cur[0]});
        } else {
            set.push({q: cur[0], a: cur[1]});
        }
    }
    return set;
}
function splitJSON(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(reverse) {
            set.push({q: arr[i][1], a: arr[i][0]});
        } else {
            set.push({q: arr[i][0], a: arr[i][1]});
        }
    }
    return set;
}
function shuffle(arr, from, to)
{
    var i,
        rand,
        tmp;
    
    if (!arr) {
        return;
    }
    
    if (typeof from === "undefined") {
        from = 0;
    }
    
    if (typeof to === "undefined") {
        to = arr.length - 1;
    }
    
    for (i = from; i < to; i += 1) {
        rand = Math.floor(Math.random() * (to - from + 1)) + from;
        if (rand !== i) {
            tmp = arr[i];
            arr[i] = arr[rand];
            arr[rand] = tmp;
        }
    }
}
function generateChoices(arr, count, ans) {
    var choices = [];
    while(choices.length + 1 < count) {
        var cur = randArr(arr);
        if(cur.a !== ans && !choices.includes(cur.a)) {
            choices.push(cur.a);
        }
    }
    var ansI = Math.floor(count*Math.random());
    choices.splice(ansI, 0, ans);
    return {choices: choices, ansI: ansI};
}
loadPage();
