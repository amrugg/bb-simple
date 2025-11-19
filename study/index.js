var mode = "wait";
var speed = 75;
var readIndex = 0;
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
        desc: "Actually same as buzzer",
        begin: function() {
            if(shouldShuffle) {
                shuffle(activeSet);
            }
            index = -1;
            strikes = 0;
            score = 0;
            askQuestion();
        },
        askQuestion: function (question) {
            if(activeSet.length) {
                mode = "read";
                console.log(mode);
                hideButtons();
                header.textContent = "";
                readIndex = 0;
                if(speed) {
                    readInt = setInterval(read, speed);
                } else {
                    header.textContent = curQuestion.q;
                }
            } else {
                win();
            }
        },
        answer: function(i) {
            if(i === 0) {
                correct();
            } else {
                incorrect();
            }
        }
    },
    "Multiple Choice": {
        desc: "Actually same as buzzer",
        choices: 4,
        begin: function() {
            fullSet = activeSet.slice();
            if(shouldShuffle) {
                shuffle(activeSet);
            }
            index = -1;
            strikes = 0;
            score = 0;
            askQuestion();
        },
        askQuestion: function (question, qChoices) {
            if(activeSet.length) {
                mode = "answer";
                var choices;
                if(qChoices) {
                    choices = {choices: qChoices.slice()};
                    var random = Math.round(Math.random()*qChoices.length);
                    choices.choices.splice(random,0,question.a);
                    choices.ansI = random;
                } else {
                    choices = generateChoices(fullSet, curGame.choices, question.a);
                }
                buttons.forEach(function(b, i) {
                    b.textContent = choices.choices[i];
                });
                curGame.ansI = choices.ansI;
                header.textContent = question.q;
                styleMultiple();
            } else {
                win();
            }
        },
        answer: function (i) {
            if(mode !== "answer") {
                return;
            }
            var isCorrect = (curGame.ansI === i);
            setTimeout(function() {
                if(isCorrect) {
                    correct();
                } else {
                    incorrect();
                }
                buttons.forEach(function(b) {
                    b.classList.remove("green");
                    b.classList.remove("red");
                    b.classList.remove("hidden");
                });
            },500 * (isCorrect ? 1 : 2));
            mode = "anim";
            buttons.forEach(function(b,index){
                if(curGame.ansI === index) {
                    b.classList.add("green");
                } else if(i === index) {
                    b.classList.add("red");
                } else {
                    b.classList.add("hidden");
                }
            });
        }
    },
    "Order": {
        desc: "A very simple tool to test whether you know the order of a list.",
        begin: function() {
            index = -1;
            strikes = 0;
            score = 0;
            askQuestion();
            hideButtons();
        },
        askQuestion: function () {
            mode = "order";
            if(++index >= activeSet.length) {
                win()
            } else {
                header.textContent = activeSet[index];
            }
        },
        answer: function(i) {
            if(i === 0) {
                correct();
            } else {
                incorrect();
            }
        }
    },
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
var curMode = "Buzzer";
var curGame;
var reverse = false;
var shouldShuffle = true;
var readInt;
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
    var modes = Object.keys(gameModes);
    modes.forEach(function(cur) {
        var op = document.createElement("option");
        op.textContent = cur;
        op.title = gameModes[cur].desc;
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

    optionDiv.appendChild(ctxt("span", "Read speed: "));
    var speedI = document.createElement("input");
    speedI.type = "number";
    speedI.style.width = "3em";
    speedI.value = 75;
    speedI.addEventListener("input", function() {
        speed = parseInt(speedI.value);
    });
    optionDiv.appendChild(speedI);
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
    header.textContent = "Errors highlighted: " + errorSet.length;
    if(errorSet.length) {
        header.textContent += " Click here to review your mistakes!";
        header.onclick = function() {
            activeSet = errorSet;
            activeSet.forEach(function(q) {
                q.addedAlready = false;
                q.score = 0;
                q.strikes = 0;
            })
            errorSet = [];
            startGame();
        }
    }
    for(var i = buttons.length-1; i >= 0; i--) {
        buttons.pop().remove();
    }
}
function startGame() {
    for(var i = buttons.length-1; i >= 0; i--) {
        buttons.pop().remove();
    }
    curGame = gameModes[curMode];
    prepareButtons();
    curGame.begin();
}
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
    if(mode === "order") {
        askQuestion();
    } else if(mode === "read") {
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
    mode = "think";
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
    askQuestion();
}
function incorrect() {
    if(curQuestion.score) {
        curQuestion.score--;
    } else {
        curQuestion.score = 0;
    }

    if(curQuestion.strikes) {
        curQuestion.strikes++;
        if(curQuestion.strikes > strikeThreshold && !curQuestion.addedAlready) {
            errorSet.push(curQuestion);
            curQuestion.addedAlready = true;
        }
    } else {
        curQuestion.strikes = 1;
    }
    askQuestion();
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
    styleBuzzer();
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
header.addEventListener("click", function(e) {
    buzz();
});
addEventListener("paste", onPaste);
function onPaste(e) {
    text = e.clipboardData.getData("text/plain").trim();
    parseSet(text);
}
function parseSet(text) {
    if(curMode === "Order") {
        if(text.includes("→")) {
            activeSet = text.split("→");
        } else if(text.includes(";")) {
            activeSet = text.split(";");
        } else {
            activeSet = text.split(",");
        }
        if(activeSet.length > 1) {
            startGame();
        } else {
            alert("Could not parse for Order mode.");
        }
        return
    }
    if(text[0] === "[") {
        var newSet = JSON.parse(text);
        activeSet = splitJSON(newSet);
        startGame();
        return;
    }
    text = text.replace(/\t/gi, "|");
    text = text.replace(/\[/gi,"");
    text = text.replace(/\]/gi,"");

    if(text.indexOf("|") > -1) {
        text = text.split("\n");
        activeSet = split(text);
        startGame();
        return true;
    } else if(text.indexOf("\n\n") > -1) {
        text = text.split(/\n\n+/g);
        activeSet = splitEnters(text);
        startGame();
        return true;
    } else {
        header.textContent = "Could not parse";
        console.log(text);
        return false;
    }
}
function splitEnters(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(arr[i].indexOf("\n") < 1) {
            console.log("Failed on " + i + ", skipping");
            continue;
        }
        var cur = arr[i].split("\n");
        if(cur.length === 2) {
            if(reverse) {
                set.push({q: cur[1], a: cur[0], type: "buzzer"});
            } else {
                set.push({q: cur[0], a: cur[1], type: "buzzer"});
            }
        } else {
            set.push({q: cur[0], a: cur[1], choices: cur.slice(2), type: "choice"});
        }
    }
    return set;
}
function split(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(arr[i].indexOf("|") < 1) {
            continue;
        }
        var cur = arr[i].split("|");
        if(reverse) {
            set.push({q: cur[1], a: cur[0], type: "buzzer"});
        } else {
            set.push({q: cur[0], a: cur[1], type: "buzzer"});
        }
    }
    return set;
}
function splitJSON(arr) {
    var set = [];
    for(var i = 0; i < arr.length; i++) {
        if(reverse) {
            set.push({q: arr[i][1], a: arr[i][0], type: "buzzer"});
        } else {
            set.push({q: arr[i][0], a: arr[i][1], type: "buzzer"});
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
function askQuestion() {
    if(activeSet.length) {
        if(curMode === "Order") {
            return curGame.askQuestion(curQuestion);
        }

        var random = Math.floor(Math.random() * activeSet.length);
        curQuestion = activeSet[random];
        curQuestion.i = random;
        
        if(curQuestion.type === "buzzer") {
            curGame = gameModes["Buzzer"];
            curGame.askQuestion(curQuestion);
        } else if(curQuestion.type === "choice") {
            curGame = gameModes["Multiple Choice"];
            curGame.askQuestion(curQuestion, curQuestion.choices);
        }
    } else {
        win();
    }
}
function styleBuzzer() {
    buttons.forEach(function(b,i) {
        if(i === 0) {
            b.style.backgroundColor = "#4EB31B";
            b.textContent = "Knew";
            b.style.display = "block";
        } else if(i === 1) {
            b.style.backgroundColor = "#9B2318";
            b.textContent = "Didn't know";
            b.style.display = "block";
        } else {
            b.style.display = "none";
        }
    });
}
function styleMultiple() {
    buttons.forEach(function(b,i) {
        b.style.backgroundColor = "";
        b.style.display = "block";
    });
}
function prepareButtons() {
    curGame.choices = 4;
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
}
function hideButtons() {
    buttons.forEach(function(b,i) {
        b.style.display = "none";
    });
}