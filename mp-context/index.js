function cde(type, properties, children)
{
    /// Dad's function
    var el;
    var className;
    var id;
    
    if (type) {
        type = type.replace(/[.#][^.#]+/g, function (match)
        {
            if (match[0] === ".") {
                className = match.substr(1);
            } else {
                id = match.substr(1);
            }
            return "";
        });
    }
    if (type) {
        el = document.createElement(type);
        
        if (className) {
            el.classList.add.apply(el.classList, className.split(" "));
        }
        if (id) {
            el.id = id;
        }
    } else {
        el = document.createDocumentFragment();
    }
    
    /// Make properties optional.
    if (!children && Array.isArray(properties)) {
        children = properties;
        properties = undefined;
    }
    
    if (properties && !Array.isArray(properties)) {
        Object.keys(properties).forEach(function (prop)
        {
            var propName = prop;
            
            /// If the property starts with "on", it"s an event.
            if (prop.startsWith("on")) {
                el.addEventListener(prop.substring(2), properties[prop]);
            } else {
                if (prop === "class") {
                    propName = "className";
                } else if (prop === "t") {
                    propName = "textContent";
                }
                
                try {
                    if (propName === "style") {
                        Object.keys(properties[prop]).forEach(function (key)
                        {
                            el.style.setProperty(key, properties[prop][key]);
                        });
                    } else if (propName === "className" && typeof properties[prop] === "string") {
                        el.classList.add.apply(el.classList, properties[prop].split(" "));
                    } else if (typeof el[propName] === "undefined") {
                        el.setAttribute(propName, properties[prop]);
                    } else {
                        el[propName] = properties[prop];
                    }
                } catch (e) {
                    /// Sometimes Safari would through errors.
                    console.error(e, prop);
                }
            }
        });
    }
    
    if (Array.isArray(children)) {
        children.forEach(function (child)
        {
            if (child) {
                if (typeof child === "object") {
                    el.appendChild(child);
                } else {
                    el.appendChild(document.createTextNode(child));
                }
            }
        });
    }
    
    return el;
};
function openInNewTab(url) {
    var win = window.open(url, '_blank');
    if (win) {
        // Tab was successfully opened
        win.focus();
    } else {
        // Popup blocked
        alert('Please allow popups for this website');
    }
}
// (function() {
    var curSetName = null;
    var curSet = [];
    var dirty = false;

    var currentSlideIndex = 0;
    loadIndex();
    var templates;
    var page = document.getElementById("page");
    
    var setSelect = cde("select");
    page.appendChild(setSelect);
    
    var saveButton = cde("button.saveButton", {t: "Save"});
    page.appendChild(saveButton);
    saveButton.addEventListener("click", saveSet);
    
    var slidePanel = cde("div.slidePanel");
    page.appendChild(slidePanel);    
    
    var links = [];
    var linkPanel = cde("div.linkPanel")
    page.appendChild(linkPanel);
    makeLinkPanel();
    
    function makeLinkPanel() {
        linkPanel.innerHTML = "";
        var names = ["BibleForge", "Cross References", "BLB", "Bible Hub", "Bible Gateway"]
        for(var i = 0; i < links.length; i++) {
            linkPanel.appendChild(cde("a", {href: links[i], target: "_blank", rel: "noopener noreferrer"}, [
                cde("button", {t: names[i]})
            ]));
        }
    }
    
    // Load sets into dropdown
    function loadSetList(selected) {
        setSelect.innerHTML = "";
        getJSON("/sets", function(err, sets) {
            if (err) return;
            sets.forEach(function(set) {
                var opt = document.createElement("option");
                opt.value = set;
                opt.textContent = set;
                if (set === selected) opt.selected = true;
                setSelect.appendChild(opt);
            });
            if (selected && sets.indexOf(selected) === -1) {
                var opt = document.createElement("option");
                opt.value = selected;
                opt.textContent = selected;
                opt.selected = true;
                setSelect.appendChild(opt);
            }
        });
    }
    function markDirty() {
        dirty = true;
        saveButton.style.backgroundColor = "#DD4444";
    }
    function markNotDirty() {
        dirty = false;
        saveButton.style.backgroundColor = "";
    }
    window.onbeforeunload = function() {
        if (dirty) return "";
    }
    function render() {
        var cur = curSet[currentSlideIndex];
        slidePanel.textContent = "";
        function purge(htmlContent) {
            // Replace <br> with \n and remove all <div> tags (but keep their inner content)
            return htmlContent
            .replace(/<div[^>]*>/gi, '')   // Remove opening <div> tags
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/?br>/gi, '\n')       // Remove closing </div> tags
        }
        function make(prop, type) {
            var td = cde("td");
            td.appendChild(cde("h4", {t: prop}));

            if(!cur[prop]) {
                cur[prop] = "";
            }
            var editEl = cde(type === "big" || type === "multi" ? "div" : "span", {
                contenteditable: true,
                innerHTML: addBreaks(cur[prop]),
            });
            
            editEl.addEventListener("input", function() {                
                cur[prop] = purge(editEl.innerHTML);

                markDirty();
            });
            td.appendChild(editEl);


            if(type === "big") {
                td.classList.add("big");
                td.colSpan = 2;
            }

            return td;
        }
        document.title = cur.name;
        var table = cde("table.notes", [
            cde("tr", [
                cde("td", {colSpan: 2}, [
                    cde("h1", {t: cur.name})
                ])
            ]),
            cde("tr", [
                make("Title"),
                make("Themes", "multi"),
            ]),
            cde("tr", [
                make("Relationship"),
                make("Type"),
            ]),
            cde("tr", [
                make("Time"),
                make("Date"),
            ]),
            cde("tr", [
                make("Author"),
                make("Speaker"),
            ]),
            cde("tr", [
                make("Place"),
                make("CRs", "multi"),
            ]),

            cde("tr", [
                make("Before", "big"),
            ]),
            cde("tr", [
                make("After", "big"),
            ]),
            cde("tr", [
                make("Notes", "big"),
            ]),
        ]);
        var text = cde("table.text", [
            cde("tr", [
                cde("td", {colSpan: 2}, [
                    cde("h1", {t: cur.name})
                ])
            ]),
            cde("tr", [
                make("Before Text", "big"),
            ]),
            cde("tr", [
                make("Passage Text", "big"),
            ]),
            cde("tr", [
                make("After Text", "big"),
            ]),
        ]);
        slidePanel.appendChild(table);
        slidePanel.appendChild(text);

        var startV = cur.name.split(/[-–—]/)[0];
        var book = startV.split(/ \d/)[0].toLowerCase();
        var abbr = startV.substring(0,3).toLowerCase();
        var ch = startV.match(/\d+(?=:\d+)/)[0];
        var v = startV.split(":")[1];
        var substitute = {
            "psalm": "psalms",
        }
        links = [
            "https://bibleforge.com/en/" + startV + " {{day, month, year}}",
            "https://bibleadventure.com/crossReference/?verse=" + startV,
            "https://www.blueletterbible.org/kjv/" + abbr + "/" + ch + "/" + v + "/",
            "https://biblehub.com/commentaries/" + (substitute[book] || book.replaceAll(" ", "_")) + "/" + ch + "-" + v + ".htm",
            "https://www.biblegateway.com/passage/?search="+ cur.name +"&version=KJV;NKJV;ESV;NIV;NASB"
        ];
        makeLinkPanel();
    }
    function makeQuizModal() {
        var header = cde("div.modal-header", {t: "Export"});
        var closeBtn = cde("button.modal-close", {innerHTML: "&times;", onclick: closeModal});
        var typeEl = cde("select", [
            cde("option", {t: "Tabs"}),
            cde("option", {t: "JSON"}),
        ]);
        var props = [];
        function makeOptions() {
            var shouldPush = false;
            if(!props.length) {
                shouldPush = true;
                props[0] = {fullIndex: 0};
            }
            var options = [
                cde("option", {t: "Title"})
            ];
            templates.forEach(function(temp, fullIndex) {
                for(var i = 1; i <= temp.slides; i++) {
                    options.push(cde("option", {t: temp.name + " (" + i + ")"}));
                    if(shouldPush) {
                        props.push({slide: i-1, fullIndex: fullIndex+1})
                    }
                }
            });
            return cde("select", options);
        }
        var termEl = makeOptions();
        var defEl = makeOptions();
        defEl.selectedIndex = 3;
        var launchButton = cde("button", {t: "Copy"});
        var purgeEl = cde("select", [
            cde("option", {t: "None"}),
            cde("option", {t: "Parenthetical Numbers", title: "So your cross reference practice isn't spoiled"}),
        ]);
        var content = cde("div.modal-content", [
            cde("label", ["Type: ", typeEl]),
            cde("label", ["Term: ", termEl]),
            cde("label", ["Definition: ", defEl]),
            cde("label", ["Purge out: ", purgeEl]),
            launchButton
        ]);
        launchButton.addEventListener("click", function() {
            var term = props[termEl.selectedIndex];
            var def = props[defEl.selectedIndex];
            var i;
            var len = slidesData.length;
            var arr = [];
            function handle(prop, cur) {

                if(prop.fullIndex === 0) {
                    return cur[0];
                } else {
                    return cur[prop.fullIndex][prop.slide];
                }
            }
            for(var i = 0; i < len; i++) {
                var cur = slidesData[i];
                arr.push([
                    handle(term, cur),
                    handle(def, cur),
                ]);
            }
            var text;
            if(typeEl.value === "Tabs") {
                text = arr.map(function(e) {return e.join("\t")}).join("\n");
            } else if(typeEl.value === "JSON") {
                text = JSON.stringify(arr);
            }
            if(purgeEl.value === "Parenthetical Numbers") {
                text = text.replace(/ ?\(\d+\) ?/g, " ").replace(/ +/g, " ");
            }
            navigator.clipboard.writeText(text);
            launchButton.textContent = "Copied!";
        });
        var modal = cde("div.modal", [closeBtn, header, content])
        var overlay = cde("div.modal-overlay", [modal]);
        document.body.appendChild(overlay);
        function closeModal() {
            document.body.removeChild(overlay);
        }
    }
    // Load a set
    function loadSet(setName) {
        getJSON("/load?set=" + encodeURIComponent(setName), function(err, data) {
            curSet = data;
            curSetName = setName;
            debugger
            loadIndex();
            dirty = false;
            render();
        });
    }

    // Save to current set
    function saveSet() {
        saveButton.textContent = "Saving...";
        postJSON("/save?set=" + encodeURIComponent(curSetName), curSet, function(err, res) {
            if (err) {
                saveButton.textContent = "Save failed!";
            } else {
                saveButton.textContent = "Saved!";
                markNotDirty();
                setTimeout(function() { saveButton.textContent = "Save"; }, 2000);
            }
        });
    }
    addEventListener("keydown", function(e) {
        if(e.ctrlKey) {
            if(e.key === "s") {
                e.preventDefault();
                saveSet()
            } else if(Number(e.key)) {
                e.preventDefault();
                openInNewTab(links[Number(e.key)-1]);
            } else if(e.key === "ArrowDown") {
                currentSlideIndex = (currentSlideIndex + 1) % curSet.length;
                saveIndex();
                render();
            } else if(e.key === "ArrowUp") {
                currentSlideIndex--;
                if(currentSlideIndex === -1) {
                    currentSlideIndex = curSet.length-1;
                    saveIndex();
                }
                render();
            } else if(e.key === " ") {
                e.preventDefault()
                document.body.classList.toggle("showText");
            }
        }
    });

    function getJSON(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var data = JSON.parse(xhr.responseText);
                        callback(null, data);
                    } catch (e) {
                        callback(e);
                    }
                } else {
                    callback(new Error("Failed to load " + url));
                }
            }
        };
        xhr.send();
    }

    function postJSON(url, data, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    callback(null, xhr.responseText);
                } else {
                    callback(new Error("Failed to save"));
                }
            }
        };
        xhr.send(JSON.stringify(data));
    }

    if(window.location.href.startsWith("https")) {
        getJSON("/bb-simple/mp-context/sets/Senior_MPs.json", function(err, data) {
            curSet = data;
            curSetName = "Senior_MPs";
            loadIndex();
            dirty = false;
            render();
        });
    } else {
        loadSetList();
        getJSON("/sets", function(err, sets) {
            if (sets && sets.length) {
                loadSet(sets[0]);
            }
        });
    }
    function addBreaks(str) {
        return str.replaceAll("\n", "<br>");
    }
    function saveIndex() {
        localStorage.setItem("lastIndex", currentSlideIndex);
    }
    function loadIndex() {
        currentSlideIndex = localStorage.getItem("lastIndex");
        if(currentSlideIndex) {
            currentSlideIndex = Number(currentSlideIndex)
        } else {
            currentSlideIndex = 0;
        }
    }
// })();
