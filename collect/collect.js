"use strict";
/*********************************
            COLLECT
*********************************/
var Collect = {
    /*
    relevant html elements
    */
    family: undefined,
    parentSelector: undefined,
    eles: [],
    not: ":not(.noSelect)",
    options: {
        activeTab: undefined,
        activeGroup: undefined
    },
    group: {
        name: "default",
        rules: {},
        indices: {}
    },
    indexPage: false,
    /*
    create a SelectorFamily given a css selector string
    */
    buildFamily: function(selector){
        var element = this.selectorElements(true);
        if ( element ) {
            var family = new SelectorFamily(element, this.parentSelector);
            family.matchSelector(selector);
            this.setFamily(family);
        }
    },
    /*
    setup Collect interface given a SelectorFamily object
    */
    setFamily: function(family){
        this.family = family;
        // clear out current html
        while (this.html.family.lastChild) {
            this.html.family.removeChild(this.html.family.lastChild);
        }
        if ( family !== undefined ) {
            this.updateSelectorText();
            this.html.family.appendChild(this.family.ele);
            this.testSelector();
        }
        document.getElementById('selectorPreview').style.display = "block";
    },
    clearFamily: function(){
        this.family = undefined;
        resetInterface();
    },
    /*
    set the text of the SelectorFamily's selector string in the interface
    */
    updateSelectorText: function(){
        this.html.text.innerHTML = this.selector();
    },
    /*
    sets Collect.parent, stores the selector in parentSelector and turns on events for only    
    the elements whose parent is the first element matching the selector
    */
    setParent: function(){
        this.parentSelector = this.selector();
        if ( this.parentSelector  === "") {
            this.parentSelector = undefined;
            return false;
        }
        // parent to select elements from is the first element in the page matching the selector
        this.html.parent.textContent = this.parentSelector;
        this.clearFamily();
        this.turnOn();
        return true;
    },
    /*
    remove parent & parentSelector, attaches events to all non-.noSelect elements
    */
    removeParent: function(){
        this.parentSelector = undefined;
        this.html.parent.textContent = "";
        this.clearFamily();
        this.turnOn();
    },
    /*
    adds events listeners based on whether or not this.parentSelector is set
    if it is, only add them to children of that element, otherwise add them to all elements
    that don't have the noSelect class
    store elements with eventlisteners in this.ele
    */
    turnOn: function(){
        var prefix = this.parentSelector ? this.parentSelector : "body",
            curr;
        this.turnOff();
        this.eles = document.querySelectorAll(prefix + " *" + this.not);
        for ( var i=0, len=this.eles.length; i<len; i++ ) {
            curr = this.eles[i];
            curr.addEventListener('click', createSelectorFamily, false);
            curr.addEventListener('mouseenter', highlightElement, false);
            curr.addEventListener('mouseleave', unhighlightElement, false);
        }
        clearClass("queryCheck");
        clearClass("collectHighlight");
    },
    /*
    removes event listeners from elements in this.ele
    */
    turnOff: function(){
        var curr;
        for ( var i=0, len=this.eles.length; i<len; i++ ) {
            curr = this.eles[i];
            curr.removeEventListener('click', createSelectorFamily);
            curr.removeEventListener('mouseenter', highlightElement);
            curr.removeEventListener('mouseleave', unhighlightElement);
            
        }
        this.eles = [];
    },
    /*
    selector string based on whether toggleable elements are off or not
    */
    selector: function(){
        if ( this.family === undefined ) {
            return "";
        }
        return this.family.toString();
    },
    /*
    return the currently selected string with the parent selector, if one is selected
    */
    selectorElements: function(one){
        var selector = this.selector(),
            longSelector;
        if ( selector === "") {
            return ( one ? undefined : []);
        }
        longSelector = (this.parentSelector ? this.parentSelector: "body") + " " + selector + this.not;

        if ( one ) {
            return document.querySelector(longSelector);
        } else {
            return document.querySelectorAll(longSelector);    
        }
    },
    matchSelector: function(){
        this.elements = this.selectorElements();
        this.elementIndex = 0;
    },
    /*
    returns the first element matching the current selector as well as how many total elements
    match the selector string
    */
    testSelector: function(){
        clearClass("queryCheck");
        clearClass("collectHighlight");
        var elements = this.selectorElements(),
            count;
        for ( var i=0, len=elements.length; i<len; i++ ) {
            elements[i].classList.add("queryCheck");
        }
        count = elements.length ? elements.length : "";
        document.getElementById("currentCount").textContent = count;
    },
    /*
    messy proof of concept
    */
    setup: function(){
        // make sure there is a rules object for the current hostname
        
        addInterface();
        this.html = {
            family: document.getElementById("selectorHolder"),
            text: document.getElementById("selectorText"),
            parent: document.getElementById("parentSelector")
        };
        
        // don't call loadSavedItems until hostname has been setup because it is asynchronous
        // and will throw errors the first time visiting a site and opening collectJS
        setupHostname(this.loadSavedItems);
        this.turnOn();
        this.interfaceEvents();
        this.bubbleEvents();
    },
    loadSavedItems: function(){
        // add option elements for all of the groups in sites[window.location.hostname].groups
        chrome.storage.local.get('sites', function loadGroupsChrome(storage){
            var host = window.location.hostname,
                site = storage.sites[host],
                groups = site.groups,
                select = document.getElementById("allGroups"),
                newOption;

            for ( var key in groups ) {
                newOption = document.createElement("option");
                newOption.setAttribute("value", key);
                newOption.textContent = key;
                select.appendChild(newOption);
            }

            Collect.group = groups["default"];
            loadGroupObject(Collect.group);
        });
    },
    interfaceEvents: function(){
        // preview
        document.getElementById("clearSelector").addEventListener('click', removeSelectorEvent, false);
        document.getElementById("saveSelector").addEventListener("click", showRuleInputs, false);

        // rule preview
        document.getElementById("saveRule").addEventListener("click", saveRuleEvent, false);
        document.getElementById("ruleCyclePrevious").addEventListener("click", showPreviousElement, false);
        document.getElementById("ruleCycleNext").addEventListener("click", showNextElement, false);
        document.getElementById("ruleRange").addEventListener("blur", applyRuleRange, false);


        // tabs
        addEvents(document.querySelectorAll("#collectTabs .toggle"), 'click', toggleTab);
        document.getElementById("addIndex").addEventListener("click", toggleIndex, false);
        document.getElementById('closeCollect').addEventListener('click', removeInterface, false);
        document.getElementById("toggleParent").addEventListener("click", toggleParentEvent, false);
        document.getElementById("previewTab").addEventListener("click", togglePreview, false);
        document.getElementById("uploadRules").addEventListener("click", uploadRules, false);
        document.getElementById("newGroup").addEventListener("click", createNewGroup, false);
        document.getElementById("deleteGroup").addEventListener("click", deleteGroup, false);
        document.getElementById("allGroups").addEventListener("change", loadGroup, false);
    },
    /*
    events that bubble up from selector elements, but interact with the interface
    */
    bubbleEvents: function(){
        /*
        events that bubble up to the interface
        */
        function update(event){
            if ( event.target.classList.contains("toggleable") ) {
                Collect.updateSelectorText();
                Collect.testSelector();    
            }
        }

        function removeSelectorFromFamily(event){
            if ( event.target.classList.contains("deltog")) {
                event.stopPropagation();
                // .selectorGroup is the parent
                var parent = event.target.parentElement,
                    groups = document.getElementsByClassName("selectorGroup");
                for ( var i=0, len=groups.length; i<len; i++ ) {
                    if ( groups[i] === parent ) {
                        Collect.family.removeElement(i);
                        break;
                    }
                }
                Collect.updateSelectorText();
                Collect.testSelector();
            }
        }
        this.html.family.addEventListener("click", update, false);
        this.html.family.addEventListener("click", removeSelectorFromFamily, false);

    }
};

Collect.setup();

function addInterface(){
    var div = noSelectElement("div");
    div.setAttribute("id", "collectjs");
    div.innerHTML = "<div id=\"collectTopbar\"><div id=\"selectorButtons\" class=\"topbarGroup\"><div id=\"selectorTabs\"><div class=\"tab hidden\" id=\"parentTab\"><div id=\"parentWrapper\" title=\"parent selector\">Parent <span id=\"parentSelector\"></span><button id=\"toggleParent\" title=\"add parent selector\">+</button></div></div><div class=\"tab\" id=\"selectorCount\">Count <span id=\"currentCount\"></span></div><div class=\"tab toggle\" id=\"previewTab\" data-for=\"previewGroup\">Preview</div><div class=\"tab\" id=\"clearSelector\">Clear</div></div><div id=\"selectorGroups\"><div id=\"previewGroup\" class=\"group\"><div id=\"rulePreview\"></div></div></div></div><div id=\"collectOptions\" class=\"topbarGroup\"><div id=\"collectTabs\"><div class=\"tab toggle\" id=\"groupTab\" data-for=\"groupGroup\">Group<span id=\"groupName\"></span></div><div class=\"tab toggle\" id=\"ruleTab\" data-for=\"ruleGroup\">Rules</div><div class=\"tab toggle\" id=\"optionTab\" data-for=\"optionGroup\">Options</div><div class=\"tab\" id=\"indexTab\">Index Page<input type=\"checkbox\" id=\"addIndex\"></div><div class=\"tab\" id=\"closeCollect\" title=\"close collectjs\">&times;</div></div><div id=\"tabGroups\"><div id=\"groupGroup\" class=\"group\"><select id=\"allGroups\"></select><button id=\"newGroup\">Add Rule Group</button><button id=\"deleteGroup\">Remove Rule Group</button></div><div id=\"optionGroup\" class=\"group\"></div><div id=\"ruleGroup\" class=\"group\"><div id=\"savedRuleHolder\"><div class=\"ruleGroup\" data-selector=\"default\"><div class=\"groupRules\"></div></div></div><button id=\"uploadRules\">Upload Saved Rules</button></div></div></div></div><div id=\"collectMain\"><div id=\"selectorPreview\">Selector: <span id=\"selectorText\"></span></div><div id=\"selectorItems\" class=\"items\"><div id=\"selectorHolder\"></div><button id=\"saveSelector\">Confirm Selector</button></div><div id=\"ruleItems\" class=\"items\"><div id=\"ruleAlert\"></div><div id=\"ruleHTMLHolder\"><button id=\"ruleCyclePrevious\" class=\"cycle\" title=\"previous element matching selector\">Previous</button><span id=\"ruleHTML\"></span><button id=\"ruleCycleNext\" class=\"cycle\" title=\"next element matching selector\">Next</button></div><div id=\"ruleInputs\"><div class=\"rule\"><label for=\"ruleName\">Name:</label><input id=\"ruleName\" name=\"ruleName\" type=\"text\"></input></div><div class=\"rule\"><label for=\"ruleAttr\">Attribute:</label><input id=\"ruleAttr\" name=\"ruleAttr\" type=\"text\"></input></div><div class=\"rule\"><label for=\"ruleRange\">Range:</label><input id=\"ruleRange\" name=\"ruleRange\" type=\"text\"></input></div></div><button id=\"saveRule\">Save Rule</button></div></div>";
    document.body.appendChild(div);
    addNoSelect(div.querySelectorAll("*"));
}

function resetInterface(){
    clearClass("queryCheck");
    Collect.html.text.textContent = '';
    document.getElementById("currentCount").textContent = "";

    // selectorItems
    var family = Collect.html.family;
    while (family.lastChild) {
        family.removeChild(family.lastChild);
    }

    // ruleItems
    document.getElementById("rulePreview").innerHTML = "";
    document.getElementById("ruleHTML").innerHTML = "";
    var inputs = document.querySelectorAll("#ruleInputs input"),
        len = inputs.length;
    for ( var i=0; i<len; i++ ) {
        inputs[i].value = "";
    }

    // divs to hide
    document.getElementById("selectorPreview").style.display = "none";    
    
    document.getElementById("selectorItems").style.display = "none";
    document.getElementById("ruleItems").style.display = "none";
}

/******************
    EVENTS
******************/
/*
event to create a SelectorFamily from this element
*/
function createSelectorFamily(event){
    event.stopPropagation();
    event.preventDefault();
    resetInterface();
    var family = new SelectorFamily(this, Collect.parentSelector);
    document.getElementById("selectorItems").style.display = "inline-block";
    Collect.setFamily(family);
}

/*
add .collectHighlight to an element on mouseenter
*/
function highlightElement(event){
    this.classList.add("collectHighlight");
}

/*
remove .collectHighlight from an element on mouseleave
*/
function unhighlightElement(event){
    this.classList.remove("collectHighlight");
}

/*
toggle whether the current page's url represents an index page for the crawler.
saves index page in chrome.storage
*/
function toggleIndex(event){  
    chrome.storage.local.get("sites", function(storage){
        var host = window.location.hostname,
            url = window.location.href,
            tab = document.getElementById("indexTab"),
            group = Collect.currentGroup;
        // adding
        if ( !tab.classList.contains("set")) {
            // set right away, remove if there is an error
            tab.classList.add("set");
            storage.sites[host].groups[group].indices[url] = true;
        }
        // removing
        else {
            // remove right away, reset if there is an error
            tab.classList.remove("set");
            if ( storage.sites[host].groups[group].indices[url] ) {
                delete storage.sites[host].groups[group].indices[url];    
            }
        }
        document.getElementById("parentTab").classList.toggle("hidden");
        chrome.storage.local.set({"sites": storage.sites});
    });
}

/*
removes the collectjs interface from the page
*/
function removeInterface(event){
    event.stopPropagation();
    event.preventDefault();
    Collect.turnOff();
    clearClass('queryCheck');
    clearClass('collectHighlight');
    var elesToRemove = ["collectjs"],
        curr;
    for ( var i=0, len=elesToRemove.length; i<len; i++ ) {
        curr = document.getElementById(elesToRemove[i]);
        curr.parentElement.removeChild(curr);
    }
}

/*
clear the current SelectorFamily
*/
function removeSelectorEvent(event){
    event.stopPropagation();
    event.preventDefault();
    Collect.clearFamily();
}

function showRuleInputs(event){
    Collect.matchSelector();
    var ele = Collect.elements[0];
    if ( ele ) {
        document.getElementById("selectorItems").style.display = "none";
        document.getElementById("ruleItems").style.display = "inline-block";
        addSelectorTextHTML(ele);
    }
}

function hideRuleInputs(event){
    document.getElementById("selectorItems").style.display = "inline-block";
    document.getElementById("ruleItems").style.display = "none";
}

/*
on blur, update Collect.elements based on the value of #ruleRange
*/
function applyRuleRange(event){
    var rangeElement = document.getElementById("ruleRange"),
        range = rangeElement.value,
        rangeInt = parseInt(range, 10),
        len = Collect.elements.length;
    Collect.matchSelector();
    if ( !isNaN(rangeInt) ) {
        if ( rangeInt < 0 ) {
            if ( -1*rangeInt > len ) {
                rangeElement.value = "";
            } else {
                Collect.elements = Array.prototype.slice.call(Collect.elements).slice(0, rangeInt);
                Collect.elementIndex = 0;
                addSelectorTextHTML(Collect.elements[0]);
            }
        } else if ( range > 0 ) {
            if ( rangeInt > len-1) {
                rangeElement.value = "";
            } else {
                Collect.elements = Array.prototype.slice.call(Collect.elements).slice(rangeInt);
                Collect.elementIndex = 0;
                addSelectorTextHTML(Collect.elements[0]);
            }
        }
    } else {
        rangeElement.value = "";
    }
    document.getElementById("currentCount").textContent = Collect.elements.length;
    generatePreviewElements(document.getElementById("ruleAttr").value, Collect.elements);
}

/*
cycle to the previous element (based on Collect.elementIndex and Collect.elements) to represent an
element in #ruleHTML
*/
function showPreviousElement(event){
    var index = Collect.elementIndex,
        len = Collect.elements.length;
    Collect.elementIndex = (index=== 0) ? len-1 : index-1;
    addSelectorTextHTML(Collect.elements[Collect.elementIndex]);
    markCapture();
}

/*
cycle to the next element (based on Collect.elementIndex and Collect.elements) to represent an
element in #ruleHTML
*/
function showNextElement(event){
    var index = Collect.elementIndex,
        len = Collect.elements.length;
    Collect.elementIndex = (index=== len-1) ? 0 : index+1;
    addSelectorTextHTML(Collect.elements[Collect.elementIndex]);
    markCapture();
}

/*
if the .capture element clicked does not have the .selected class, set attribute to capture
otherwise, clear the attribute to capture
toggle .selected class
*/
function capturePreview(event){
    if ( !this.classList.contains("selected") ){
        clearClass("selected");
        var elements = Collect.selectorElements(),
            capture = this.dataset.capture;
        generatePreviewElements(capture, elements);
        document.getElementById("ruleAttr").value = capture;
        this.classList.add("selected");
    } else {
        document.getElementById("ruleAttr").value ='';
        document.getElementById("rulePreview").innerHTML = "";
        this.classList.remove("selected");
    }   
}

function saveRuleEvent(event){
    var name = document.getElementById("ruleName").value,
        selector = document.getElementById("selectorText").textContent,
        capture = document.getElementById("ruleAttr").value,
        range = document.getElementById("ruleRange").value,
        error = false,
        rule;
    clearErrors();
    document.getElementById("ruleAlert").innerHTML = "";
    if ( name === "") {
        error = true;
        ruleAlertMessage("Name needs to be filled in");
        document.getElementById("ruleName").classList.add("error");
    }
    if ( selector === "" ) {
        error = true;
        ruleAlertMessage("No css selector");
    }
    if ( capture === "" ) {
        error = true;
        ruleAlertMessage("No attribute selected");
        document.getElementById("ruleAttr").classList.add("error");
        // some message that capture isn't define
    }
    if ( error ) {
        return;
    }
    rule = {
        name: name,
        capture: capture,
        selector: selector,
        index: Collect.indexPage
    };
    if ( range !== "" ) {
        rule.range = range;
    }
    if ( Collect.parentSelector ) {
        rule.parent = Collect.parentSelector;
    }
    saveRule(rule);
    resetInterface();
    addRule(rule);
}

function previewSavedRule(event){
    clearClass("queryCheck");
    clearClass("collectHighlight");

    var parent = this.parentElement,
        index = parent.dataset.index,
        parentSelector, selector, elements;

    if ( parent.dataset.index === "true" && Collect.indexPage ) {
        parentSelector = parent.dataset.parent ? parent.dataset.parent + " " : "",
        selector = parentSelector + parent.dataset.selector + Collect.not,
        elements = document.querySelectorAll(selector);
        addClass("savedPreview", elements);    
    } else if ( parent.dataset.index === "false" && !Collect.indexPage ) {
        selector = parent.dataset.selector + Collect.not,
        elements = document.querySelectorAll(selector);
        addClass("savedPreview", elements);    
    }
}

function unpreviewSavedRule(event){
    clearClass("savedPreview");
}

function deleteRuleEvent(event){
    var parent = this.parentElement,
        name = parent.dataset.name;
    deleteRule(name);
    parent.parentElement.removeChild(parent);
}

function toggleParentEvent(event){
    event.preventDefault();
    if ( !Collect.parentSelector ){
        var success = Collect.setParent();
        if ( success ) {
            this.textContent = "×";
            this.setAttribute("title", "remove parent selector");    
        }        
    } else {
        Collect.removeParent();
        this.textContent = "+";
        this.setAttribute("title", "add parent selector");
    }
    
}

function toggleTab(event){
    event.preventDefault();
    event.stopPropagation();
    if ( this.classList.contains("active") ){
        this.classList.remove("active");
        hideActive();
    } else {
        this.classList.add("active");
        showActive(this);
    }
}

function togglePreview(event){
    event.preventDefault();
    event.stopPropagation();
    var group = document.getElementById("previewGroup");
    if ( group.classList.contains("show") ){
        group.classList.remove("show");
    } else {
        group.classList.add("show");
    }
}

function uploadRules(event){
    chrome.storage.local.get(null, function(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            group = Collect.currentGroup;
        chrome.runtime.sendMessage({'type': 'upload', data: site.groups[group]});
    });
}

function createNewGroup(event){
    event.preventDefault();
    var name = prompt("Group Name");
    // make sure name isn't empty string
    if ( name === "" ) {
        return;
    }
    chrome.storage.local.get("sites", function(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            newOption;

        // if group already exists, set it as the currentGroup
        if ( site.groups[name] ) {
            setCurrentGroup(document.querySelector("#allGroups option[value=" + name + "]"));
            return;
        } else {
            newOption = document.createElement("option");
            newOption.setAttribute("value", name);
            newOption.textContent = name;
            document.getElementById("allGroups").appendChild(newOption);
            setCurrentGroup(newOption);
            
            storage.sites[host].groups[name] = {
                name: name,
                indices: {},
                rules: {}
            };
            chrome.storage.local.set({'sites': storage.sites});
        }
    });
}

/*
deletes the group currently selected, and removes its associated option from #allGroups
if the current group is "default", delete the rules for the group but don't delete the group
*/
function deleteGroup(event){
    event.preventDefault();
    var currGroup = document.querySelector("#allGroups option:checked"),
        groupName = currGroup.value,
        defaultGroup = (groupName === "default"),
        confirmed;
    if ( groupName === "default" ) {
        confirmed = confirm("Cannot delete \"default\" group. Do you want to clear out all of its rules instead?");
    } else {
        confirmed = confirm("Are you sure you want to delete this group and all of its related rules?");    
    }
    if ( !confirmed ) {
        return;
    }
    chrome.storage.local.get("sites", function deleteGroupChrome(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            currOption = document.querySelector("#allGroups option:checked");
        // just delete all of the rules for "default" option
        if ( defaultGroup ) {
            site.groups["default"] = {};
        } else {
            delete site.groups[groupName];
            currOption.parentElement.removeChild(currOption);
            Collect.currentGroup = "default";
            setCurrentGroup(document.querySelect("#allGroups option[value=default]"));
        }
        storage.sites[host] = site;
        chrome.storage.local.set({'sites': storage.sites});
    });
}

function loadGroup(event){
    event.preventDefault();
    var option = this.querySelector('option:checked'),
        name = option.value;
    chrome.storage.local.get('sites', function loadGroupsChrome(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            group = site.groups[name];
        Collect.group = group;
        loadGroupObject(group);
    });
}

/****************
EVENT HELPERS
****************/

/*
given an element, generate the html to represent an element and its "captureable" attributes and
create the event listeners for it to work
*/
function addSelectorTextHTML(ele){
    var rule = document.getElementById("ruleHTML"),
        capture;
    rule.innerHTML = selectorTextHTML(ele);
    capture = rule.getElementsByClassName("capture");
    addEvents(capture, "click", capturePreview);
}

function setCurrentGroup(option){
    Collect.currentGroup = option.value;
    option.setAttribute("selected", true);
    document.getElementById("groupName").textContent = ": " + option.value;
}

/*
given a group object (rules, indices)
*/
function loadGroupObject(group){
    var currOption = document.querySelector("#allGroups option[value=" + group.name + "]");
    setCurrentGroup(currOption);
    if ( group.rules ) {
        clearRules();
        for (var key in group.rules){
            addRule(group.rules[key]);                    
        }
    }
    if ( group.indices[window.location.href] ) {
        Collect.indexPage = true;
        document.getElementById("indexTab").classList.add("set");
        document.getElementById("addIndex").checked = true;
        document.getElementById("parentTab").classList.remove("hidden");
    } else {
        Collect.indexPage = false;
        document.getElementById("indexTab").classList.remove("set");
        document.getElementById("addIndex").checked = false;
        document.getElementById("parentTab").classList.add("hidden");
    }
}

function clearGroup(name){
    var currOption = document.querySelector("#allGroups option[value=" + name + "]");
        setCurrentGroup(currOption);

    chrome.storage.local.get('sites', function clearGroupChrome(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            group = site.groups[name],
            rules = group.rules;
    });   
}

function clearRules(){
    // clear out, don't delete default ruleGroup
    var groups = document.getElementsByClassName("ruleGroup"),
        curr;
    for ( var i=0, len=groups.length; i<len; i++ ) {
        curr = groups[i];
        if ( curr.dataset.selector === "default" ) {
            curr.querySelector(".groupRules").innerHTML = "";
        } else {
            curr.parentElement.removeChild(curr);
        }
    }
}

/*
if #ruleAttr is set, add .selected class to the matching #ruleHTML .capture span
*/
function markCapture(){
    var capture = document.getElementById("ruleAttr").value,
        selector;
    if ( capture !== "") {
        selector = ".capture[data-capture='" + capture + "']";
        document.querySelector(selector).classList.add("selected");
    }
}
/*
generate paragraphs html for the captured attribute on all of the elements and attach them to #rulePreview
*/
function generatePreviewElements(capture, elements) {
    var fn = captureFunction(capture),
        previewHTML = "";
    for ( var i=0, len=elements.length; i<len; i++ ) {
        previewHTML += "<p class=\"noSelect\">" + fn(elements[i]) + "</p>";
    }
    document.getElementById("rulePreview").innerHTML = previewHTML;
}

/*
remove .error class from rule inputs
*/
function clearErrors(){
    document.getElementById("ruleName").classList.remove("error");
    document.getElementById("ruleAttr").classList.remove("error");
}

/*
add the message to #ruleAlert
*/
function ruleAlertMessage(msg){
    var p = noSelectElement("p");
    p.textContent = msg;
    document.getElementById("ruleAlert").appendChild(p);
}


/*
add's a rule element to it's respective location in #ruleGroup
*/
function addRule(rule){
    var holder, ruleElement;

    if ( rule.parent ) {
        holder = ruleHolderHTML(rule.parent);
    } else {
        holder = document.querySelector('.ruleGroup[data-selector="default"] .groupRules');
    }

    ruleElement = ruleHTML(rule);
    holder.appendChild(ruleElement);
}

/*
returns an element for all rules with the same parent to append to
*/
function ruleHolderHTML(name){
    var group = document.querySelector('.ruleGroup[data-selector="' + name + '"]'),
        div, h2;
    if ( !group ) {
        group = noSelectElement("div");
        h2 = noSelectElement("h2");
        div = noSelectElement("div");

        group.classList.add("ruleGroup");
        group.dataset.selector = name;
        h2.textContent = name;
        div.classList.add("groupRules");

        group.appendChild(h2);
        group.appendChild(div);

        document.getElementById("savedRuleHolder").appendChild(group);
    }
    return div;
}

/*
generate and return a span representing a rule object
*/
function ruleHTML(obj){
    var span = noSelectElement("span"),
        nametag = noSelectElement("span"),
        deltog = noSelectElement("span");
    span.dataset.selector = obj.selector;
    span.dataset.name = obj.name;
    span.dataset.capture = obj.capture;
    span.dataset.index = obj.index;
    if ( obj.range) {
        span.dataset.range = obj.range;
    }
    if ( obj.parent ) {
        span.dataset.parent = obj.parent;
    }

    span.classList.add("collectGroup");
    nametag.classList.add("savedSelector");
    deltog.classList.add("deltog");

    span.appendChild(nametag);
    span.appendChild(deltog);

    nametag.textContent = obj.name;
    deltog.innerHTML = "&times;";

    nametag.addEventListener("mouseenter", previewSavedRule, false);
    nametag.addEventListener("mouseleave", unpreviewSavedRule, false);
    deltog.addEventListener("click", deleteRuleEvent, false);
    
    return span;
}

/*
show the .grouop associated with a tab
*/
function showActive(ele){
    // if one is already shown, hide that first
    hideActive();
    var groupID = ele.dataset.for,
        group = document.getElementById(groupID);
    Collect.options.activeTab = ele;
    Collect.options.activeGroup = group;
    group.classList.add("show");
}

/*
hide the active .group
*/
function hideActive(){
    if ( Collect.options.activeGroup ) {
        Collect.options.activeGroup.classList.remove("show");
    }
    if ( Collect.options.activeTab ) {
        Collect.options.activeTab.classList.remove("active");
    }
    Collect.options.activeTab = undefined;
    Collect.options.activeGroup = undefined;
}

/********************
UTILITY FUNCTIONS
********************/

function noSelectElement(type){
    var ele = document.createElement(type);
    ele.classList.add("noSelect");
    return ele;
}

// check if an element has a class
function hasClass(ele, name){   
    return ele.classList.contains(name);
}

// purge a classname from all elements with it
function clearClass(name){
    var eles = document.getElementsByClassName(name),
        len = eles.length;
    // iterate from length to 0 because its a NodeList
    while ( len-- ){
        eles[len].classList.remove(name);
    }
}

function addClass(name, eles){
    eles = Array.prototype.slice.call(eles);
    var len = eles.length;
    for ( var i=0; i<len; i++ ) {
        eles[i].classList.add(name);
    }
}

// utility function to swap two classes
function swapClasses(ele, oldClass, newClass){
    ele.classList.remove(oldClass);
    ele.classList.add(newClass);
}

/*
add an EventListener to an array/nodelist of elements
*/
function addEvents(eles, type, fn){
    // convert nodelist to array
    eles = Array.prototype.slice.call(eles);
    var len = eles.length;
    for ( var i=0; i<len; i++ ) {
        eles[i].addEventListener(type, fn, false);
    }
}

/*
remove an EventListener from an array/nodelist of elements
*/
function removeEvents(eles, type, fn){
    // convert nodelist to array
    eles = Array.prototype.slice.call(eles);
    var len = eles.length;
    for ( var i=0; i<len; i++ ) {
        eles[i].removeEventListener(type, fn);
    }
}

/*
add the .no_select class to eles array, so that collect.js doesn't try to select them
*/
function addNoSelect(eles){
    var len = eles.length;
    for( var i=0; i<len; i++ ) {
        eles[i].classList.add('noSelect');
    }
}

function selectorIsComplete(selector_object){
    if ( selector_object.name === '' || selector_object.selector === '' ||
        selector_object.capture === '' ) {
        selector_object.incomplete = true;
    }
    return selector_object;
}   

function captureFunction(capture){
    if (capture==="text") { 
        return function(ele){
            return ele.textContent;
        };
    } else if (capture.indexOf("attr-")===0) {
        // return substring after first hyphen so that it works with data- attributes
        var attribute = capture.slice(capture.indexOf("-")+1);
        return function(ele){
            return ele.getAttribute(attribute);
        };
    }
}

//    STORAGE
/*
creates an object representing a site and saves it to chrome.storage.local
the object is:
    host:
        site: <hostname>
        groups:
            <name>:
                name: <name>,
                indices: {},
                rules: {}
*/
function setupHostname(callback){
    chrome.storage.local.get("sites", function setupHostnameChrome(storage){
        var host = window.location.hostname;
        if ( !storage.sites[host] ) {
            storage.sites[host] = {
                site: host,
                groups: {
                    "default": {
                        name: "default",
                        indices: {},
                        rules: {}
                    }
                }
            };
            chrome.storage.local.set({'sites': storage.sites}, function(){
                callback();
            });
        }        
    });
}

function saveRule(rule){
    chrome.storage.local.get('sites', function saveRuleChrome(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            name = rule.name,
            group = Collect.currentGroup;
        site.groups[group].rules[name] = rule;
        storage.sites[host] = site;
        chrome.storage.local.set({'sites': storage.sites});
    });
}

function deleteRule(name){
    chrome.storage.local.get('sites', function deleteRuleChrome(storage){
        var host = window.location.hostname,
            sites = storage.sites,
            group = Collect.currentGroup;
        delete sites[host].groups[group].rules[name];
        chrome.storage.local.set({'sites': sites});
    });  
}

//GENERAL HTML RETURNING FUNCTIONS

//given an element, return html for selector text with 
//"capture"able parts wrapped
function selectorTextHTML(element) {
    if ( element === undefined ) {
        return '';
    }

    var clone = cleanElement(element.cloneNode(true)),
        html = clone.outerHTML.replace(/</g,'&lt;').replace(/>/g,'&gt;'),
        attrs = clone.attributes,
        curr, text;
    
    for ( var i=0, len =attrs.length; i<len; i++ ) {
        curr = attrs[i];
        text = attributeText(curr);
        html = html.replace(text, wrapTextHTML(text, 'attr-'+curr.name));
    }

    if ( clone.textContent !== "" ) {
        text = clone.textContent;
        html = html.replace(text, wrapTextHTML(text, 'text'));
    }

    return html;
}

function cleanElement(ele){
    ele.classList.remove('queryCheck');
    ele.classList.remove('collectHighlight');
    if ( ele.hasAttribute('src') ) {
        var value = ele.getAttribute('src'),
            query = value.indexOf('?');
        if ( query !== -1 ) {
            value = value.slice(0, query);
        }
        ele.setAttribute('src', value);
    }
    if ( ele.textContent !== "" ) {
        var innerText = ele.textContent.replace(/(\s{2,}|[\n\t]+)/g, ' ');
        if ( innerText.length > 100 ){
            innerText = innerText.slice(0, 25) + "..." + innerText.slice(-25);
        }
        ele.innerHTML = innerText;
    }
    return ele;
}

function attributeText(attr) {
    return attr.name + "=\"" + attr.value + "\"";
}

//wrap an attribute or the text of an html string 
//(used in #selector_text div)
function wrapTextHTML(text, type){
    // don't include empty properties
    if ( text.indexOf('=""') !== -1 ) {
        return '';
    }
    return '<span class="capture no_select" title="click to capture ' + type + 
        ' property" data-capture="' + type + '">' + text + '</span>';
}

