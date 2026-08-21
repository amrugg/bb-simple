(function() {
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
    var loadedSets = {};
    var curSetName = null;
    var curSet = [];
    var dirty = false;

    var currentSlideIndex = 0;
    loadIndex();
    var templates;
    var page = document.getElementById("page");
    
    var setSelect = cde("select");
    page.appendChild(setSelect);
    setSelect.addEventListener("input", function() {
        loadSet(setSelect.value);
    });
    
    var topRightMenu = cde("div.top-right-menu");
    page.appendChild(topRightMenu);

    var openSearchMenuButton = cde("button", {t: "Search", title: "Ctrl + E", onclick: openSearchMenu});
    topRightMenu.appendChild(openSearchMenuButton);

    var saveButton = cde("button", {t: "Save", title: "Ctrl + S", onclick: saveSet});
    topRightMenu.appendChild(saveButton);

    var selectIndexVal = cde("input.selectIndexVal", {type: "number", min: 1, oninput: function() {
        if(selectIndexVal.valueAsNumber > 0 && selectIndexVal.valueAsNumber <= curSet.length) {
            currentSlideIndex = selectIndexVal.valueAsNumber-1;
            console.log(currentSlideIndex);
            render();
        }
    }});
    var selectIndexDenominator = cde("span", {t: 120});
    page.appendChild(cde("div.selectIndexCont", [selectIndexVal, " / ", selectIndexDenominator]));
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
        saveIndex();
        selectIndexVal.value = (currentSlideIndex+1);
        function purge(htmlContent) {
            // Replace <br> with \n and remove all <div> tags (but keep their inner content)
            return htmlContent;/*
            .replace(/<div[^>]*>/gi, '\n')   // Remove opening <div> tags
            .replace(/<\/div>/gi, '\n')
            .replace(/<\/?br>/gi, '\n')       // Remove closing </div> tags
            .trim();*/
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
        function dispSet(err, data) {
            curSet = data;
            curSetName = setName;
            localStorage.setItem("lastSetName", curSetName);
            loadIndex();
            dirty = false;
            render();
            selectIndexDenominator.textContent = curSet.length;
            if(!loadedSets[setName]) {
                loadedSets[setName] = curSet;
            }
        }
        if(loadedSets[setName]) {
            dispSet(null, loadedSets[setName]);
        }
        getJSON("/load?set=" + encodeURIComponent(setName), dispSet);
    }
    


    var searchBar = cde("input.searchBar", {type: "text", placeholder: "Search", onkeydown: function(e) {
        if(e.key === "Enter") {
            searchCurSet();
        }
    }});
    var searchButton = cde("button", {t: "Search", onclick: searchCurSet});

    var searchPresets = {
        "Notes & Text": ["name", "Title", "Passage Text", "Themes", "Relationship", "Type", "Time", "Date", "CRs", "Author", "Speaker", "Place", "Before", "After", "Notes"],
        "Notes Only": ["Title", "Themes", "Relationship", "Type", "Time", "Date", "Author", "Speaker", "Place", "Before", "After", "Notes"],
        "Passage Text": ["Passage Text"],
        "All": ["name", "Before Text", "Passage Text", "After Text", "Title", "Themes", "Relationship", "Type", "Time", "Date", "Author", "Speaker", "Place", "CRs", "Before", "After", "Notes"],
    }
    var searchPresetSelect = cde("select", Object.keys(searchPresets).map(function(name) {
        return cde("option", {t: name});
    }));
    var resultsContainer = cde("div.resultsCont");
    var menuClose = cde("button.modal-close", {innerHTML: "&times;", onclick: function() {
        closeSearchMenu();
    }});
    var searchMenu = cde("div.searchMenu", [
        menuClose,
        searchBar,
        searchPresetSelect,
        searchButton,
        cde("h3", {t: "Results"}),
        resultsContainer
    ]);
    
    page.appendChild(searchMenu);

    function searchCurSet() {
        searchSet(searchBar.value, curSet);
    }
    function escapeRegex(str) {
        /// Escape special regex characters: . * + ? ^ $ { } ( ) | [ ] \
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function stripHtml(html) {
        var doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent ?? "";
    }
    function goToIndex(index) {
        closeSearchMenu();
        currentSlideIndex = index;
        render();
    }
    function searchSet(origPattern, set, isRegex) {
        var pattern = origPattern.trim();
        if(!pattern) return;
        if(!isRegex) {
            pattern = escapeRegex(pattern)
        }
        var propertiesToSearch = searchPresets[searchPresetSelect.value];
        resultsContainer.textContent = "";
        var searchRegex = new RegExp(pattern, "gi");
        function createSearchResult(entry, property,index) {
            var result = cde("div.result", {ondblclick: function(){goToIndex(index)}});
            if(property === "name") {
                result.appendChild(cde("h3", {innerHTML: entry.name.replace(searchRegex, "<span class=highlight>$&</span>")}));
                resultsContainer.appendChild(result);    
                return;
            }

            var formattedText = entry[property];
            if(!searchRegex.test(formattedText)) {
                formattedText = stripHtml(formattedText);
            }
            formattedText = formattedText.replace(searchRegex, "<span class=highlight>$&</span>")
            result.append(...[
                cde("h3", {t: entry.name}),
                cde("div", [
                    cde("i", {t: property + ": "}),
                    cde("div", {innerHTML: formattedText})
                ])
            ]);
            resultsContainer.appendChild(result);
        }
        function searchThrough(entry, setIndex) {   
            var i;
            var len = propertiesToSearch.length;
            for(i = 0; i < len; i++) {
                var curProp = propertiesToSearch[i];
                var curVal = stripHtml(entry[curProp]);
                if(searchRegex.test(curVal)) {
                    foundSomething = true;
                    createSearchResult(entry, curProp, setIndex);
                }
            }
        }
        var foundSomething = false;
        for(var i = 0; i < set.length; i++) {
            searchThrough(set[i], i);
        }
        if(!foundSomething) {
            resultsContainer.appendChild(cde("i", {t: "No results for " + origPattern + "."}));
        }
    }
    function openSearchMenu() {
        searchMenu.classList.add("active");
        searchBar.focus();
        searchBar.placeholder = "Search " + curSetName;
    }
    function closeSearchMenu() {
        searchMenu.classList.remove("active");
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
            if(e.code === "KeyS") {
                e.preventDefault();
                saveSet()
            } else if(e.code === "KeyE") {
                openSearchMenu();
            } else if(Number(e.key)) {
                if(links[Number(e.key)-1]) {
                    e.preventDefault();
                    openInNewTab(links[Number(e.key)-1]);
                }
            } else if(e.key === "ArrowUp") {
                currentSlideIndex = (currentSlideIndex + 1) % curSet.length;
                render();
            } else if(e.key === "ArrowDown") {
                currentSlideIndex--;
                if(currentSlideIndex === -1) {
                    currentSlideIndex = curSet.length-1;
                }
                render();
            } else if(e.key === " ") {
                e.preventDefault()
                document.body.classList.toggle("showText");
                selectIndexVal.blur();
            } else if(e.shiftKey && e.code === "KeyH") {
                insertOrWrap(prompt("Element:"));
            }
        }
        if(e.code === "Escape") {
            closeSearchMenu();
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

    loadSetList();
    getJSON("/sets", function(err, sets) {
        if (sets && sets.length) {
            var lastSetName = localStorage.getItem("lastSetName") || sets[0];
            setSelect.value = lastSetName;
            loadSet(lastSetName);
        }
    });
    function addBreaks(str) {
        return str.replaceAll("\n", "<br>");
    }
    function saveIndex() {
        localStorage.setItem(curSetName + "-lastIndex", currentSlideIndex);
    }
    function loadIndex() {
        currentSlideIndex = localStorage.getItem(curSetName + "-lastIndex");
        if(currentSlideIndex) {
            currentSlideIndex = Number(currentSlideIndex)
        } else {
            currentSlideIndex = 0;
        }
    }
    function insertOrWrap(tagName) {
        var sel = window.getSelection();
        if (!sel.rangeCount) return;

        var range = sel.getRangeAt(0);
        var node = range.commonAncestorContainer;

        // Walk up the DOM to confirm we're inside a contenteditable element
        var current = node.nodeType === 1 ? node : node.parentNode;
        var editable = null;
        while (current) {
            if (current.contentEditable === "true") {
                editable = current;
                break;
            }
            current = current.parentNode;
        }

        if (!editable) return;

        var el = document.createElement(tagName);

        if (range.collapsed) {
            // No text selected — drop an empty element at the caret
            el.innerHTML = "\u200B"; // zero-width space keeps the cursor inside
            range.insertNode(el);
            range.selectNodeContents(el);
        } else {
            // Text is selected — wrap it in the new element
            range.surroundContents(el);
        }

        // Re-apply the range so the caret/selection stays visible
        sel.removeAllRanges();
        sel.addRange(range);
    }
})();
