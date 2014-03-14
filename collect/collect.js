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
    activeRule: {},
    rules: {},
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
        document.getElementById('selectorButtons').style.display = "inline-block";
    },
    clearFamily: function(){
        this.family = undefined;
        resetInterface();
    },
    /*
    set the text of the SelectorFamily's selector string in the interface
    */
    updateSelectorText: function(){
        var selectorString = (this.parentSelector ? this.parentSelector + " ": "") + this.selector();
        this.html.text.textContent = selectorString;
    },
    /*
    sets Collect.parent, stores the selector in parentSelector and turns on events for only    
    the elements whose parent is the first element matching the selector
    */
    setParent: function(){
        this.parentSelector = this.selector();
        if ( this.parentSelector  === "") {
            this.parentSelector = undefined;
        }
        // parent to select elements from is the first element in the page matching the selector
        this.html.parent.textContent = this.parentSelector;
        this.clearFamily();
        this.turnOn();
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
    /*
    returns the first element matching the current selector as well as how many total elements
    match the selector string
    */
    testSelector: function(){
        clearClass("queryCheck");
        var elements = this.selectorElements(),
            count;
        for ( var i=0, len=elements.length; i<len; i++ ) {
            elements[i].classList.add("queryCheck");
        }
        count = elements.length ? "Count: " + elements.length : "";
        document.getElementById("selectorCount").textContent = count;
    },
    /*
    messy proof of concept
    */
    setup: function(){
        addInterface();
        this.html = {
            family: document.getElementById("selectorHolder"),
            text: document.getElementById("selectorText"),
            parent: document.getElementById("parentSelector")
        }
        // make sure there is a rules object for the current hostname
        setupHostname();
        this.loadSavedItems();
        this.turnOn();
        this.interfaceEvents();
        this.bubbleEvents();
    },
    loadSavedItems: function(){
        chrome.storage.local.get('sites', function loadRulesChrome(storage){
            var host = window.location.hostname,
                holder = document.getElementById("savedRuleHolder")
            // rules
            Collect.rules = storage.sites[host].rules;
            for (var key in Collect.rules){
                holder.appendChild(ruleHTML(Collect.rules[key]));
            }

            if ( storage.sites[host].indices[window.location.href] ) {
                document.getElementById("indexTab").classList.add("set");
                document.getElementById("addIndex").checked = true;
            }
        });
    },
    interfaceEvents: function(){
        // preview
        document.getElementById("clearSelector").addEventListener('click', removeSelectorEvent, false);
        document.getElementById("addParent").addEventListener("click", addParentEvent, false);
        document.getElementById("saveSelector").addEventListener("click", showRuleModal, false);

        // rule preview
        document.getElementById("ruleBackground").addEventListener("click", hideRuleModal, false);
        document.getElementById("closeRuleModal").addEventListener("click", hideRuleModal, false);
        document.getElementById("saveRule").addEventListener("click", saveRuleEvent, false);

        // tabs
        addEvents(document.querySelectorAll("#collectTabs .toggle"), 'click', toggleTab);
        document.getElementById("addIndex").addEventListener("click", toggleIndex, false);
        document.getElementById('closeCollect').addEventListener('click', removeInterface, false);
        document.getElementById("removeParent").addEventListener("click", removeParentEvent, false);

        
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

function addInterface(){
    var div = document.createElement("div");
    div.setAttribute("id", "collectjs");
    div.classList.add("noSelect");
    div.innerHTML = "<div id=\"collectMain\">    <div id=\"selectorHolder\"></div></div><div id=\"selectorPreview\" class=\"topbar\"><span id=\"selectorText\"></span><span id=\"selectorCount\"></span><div id=\"selectorButtons\"><button id=\"saveSelector\">Save</button><button id=\"clearSelector\">Clear</button><button id=\"addParent\" title=\"Use the current selector as a parent selector\">Parent</button></div></div><div id=\"collectOptions\" class=\"topbar\"><div id=\"collectTabs\">    <div class=\"tab\">    <span>Parent</span>    <section id=\"parentWrapper\">    <span id=\"parentSelector\"></span>    <button id=\"removeParent\">&times;</button>    </section>    </div>    <div class=\"tab toggle\" id=\"ruleTab\" data-for=\"ruleGroup\">Rules</div>    <div class=\"tab toggle\" id=\"optionTab\" data-for=\"optionGroup\">Options</div>    <div class=\"tab toggle\" id=\"indexTab\" data-for=\"indexGroup\">Index Pages</div>    <div class=\"tab\" id=\"closeCollect\" title=\"remove parent selector\">&times;</div></div><div id=\"tabGroups\">    <div id=\"optionGroup\" class=\"group\">    </div>    <div id=\"ruleGroup\" class=\"group\">    <div id=\"savedRuleHolder\"></div>    </div>    <div id=\"indexGroup\" class=\"group\">    <label for=\"addIndex\">Index Page:</label><input type=\"checkbox\" id=\"addIndex\">    </div></div></div><div id=\"ruleHolder\"><div id=\"ruleBackground\"></div><div id=\"ruleModal\"><div><label for=\"ruleName\">Name:</label><input id=\"ruleName\" name=\"ruleName\" type=\"text\"></input></div><div id=\"ruleHTML\"></div><div id=\"rulePreview\"></div><div id=\"ruleButtons\"><button id=\"saveRule\">Save</button><button id=\"closeRuleModal\">Close</button></div></div></div>";
    
    document.body.appendChild(div);
    addNoSelect(div.querySelectorAll("*"));
}

function resetInterface(){
    clearClass("queryCheck");
    document.getElementById("selectorCount").textContent = "";
    var family = Collect.html.family;
    while (family.lastChild) {
        family.removeChild(family.lastChild);
    }
    Collect.html.text.textContent = '';
    document.getElementById('selectorButtons').style.display = "none";
}

/******************
    EVENTS
******************/
function createSelectorFamily(event){
    event.stopPropagation();
    event.preventDefault();
    var family = new SelectorFamily(this, Collect.parentSelector);
    Collect.setFamily(family);
}

function highlightElement(event){
    this.classList.add("collectHighlight");
}

function unhighlightElement(event){
    this.classList.remove("collectHighlight");
}

function toggleIndex(event){
    
    chrome.storage.local.get("sites", function(storage){
        var host = window.location.hostname,
            url = window.location.href,
            tab = document.getElementById("indexTab");
        // adding
        if ( !tab.classList.contains("set")) {
            // set right away, remove if there is an error
            tab.classList.add("set");
            chrome.runtime.sendMessage({'type': 'addindex', 'url': url}, function addIndexChrome(response){
                if ( !response.error ){
                    storage.sites[host].indices[url] = true;
                    chrome.storage.local.set({"sites": storage.sites});
                } else {
                    tab.classList.remove("set");
                }
            });
        }
        // removing
        else {
            // remove right away, reset if there is an error
            tab.classList.remove("set");
            delete storage.sites[host].indices[url];
            chrome.runtime.sendMessage({'type': 'removeindex', 'url': url}, function removeIndexChrome(response){
                if ( !response.error ){
                    chrome.storage.local.set({"sites": storage.sites});
                } else {
                    tab.classList.add("set");
                }
            });
        }
    });
}


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

function removeSelectorEvent(event){
    event.stopPropagation();
    event.preventDefault();
    Collect.clearFamily();
}

function showRuleModal(event){
    var ele = Collect.selectorElements(true),
        ruleHTML = document.getElementById("ruleHTML"),
        html, capture;
    if ( ele ) {
        html = selectorTextHTML(ele)
        ruleHTML.innerHTML = html;
        capture = ruleHTML.getElementsByClassName("capture");
        addEvents(capture, "click", capturePreview);
        document.getElementById("ruleHolder").style.display = "block";
    }
}

function capturePreview(event){
    if ( !this.classList.contains("selected") ){
        clearClass("selected");
        var elements = Collect.selectorElements(),
            capture = this.dataset.capture,
            fn = captureFunction(capture),
            previewHTML = "";
        Collect.activeRule.capture = capture;
        for ( var i=0, len=elements.length; i<len; i++ ) {
            previewHTML += "<p>" + fn(elements[i]) + "</p>";
        }
        this.classList.add("selected");
        document.getElementById("rulePreview").innerHTML = previewHTML;
    } else {
        Collect.activeRule.capture = undefined;
        document.getElementById("rulePreview").innerHTML = "";
        this.classList.remove("selected");
    }
    
}

function hideRuleModal(event){
    hideModal();
}

function hideModal(){
    document.getElementById("rulePreview").innerHTML = "";
    document.getElementById("ruleHTML").innerHTML = "";
    document.getElementById("ruleName").value = "";
    document.getElementById("ruleHolder").style.display = "none";
}

function saveRuleEvent(event){
    var name = document.getElementById("ruleName").value,
        selector = document.getElementById("selectorText").textContent,
        capture = Collect.activeRule.capture,
        rule;
    if ( name === "") {
        return;
    }
    if ( selector === "" ) {
        return;
    }
    if ( capture === undefined ) {
        return;
    }
    rule = {
        name: name,
        capture: capture,
        selector: selector
    };
    saveRule(rule);
    hideModal();
    resetInterface();
    document.getElementById("savedRuleHolder").appendChild(ruleHTML(rule));
}


function ruleHTML(obj){
    var span = document.createElement("span"),
        nametag = document.createElement("span"),
        deltog = document.createElement("span");
    span.dataset.selector = obj.selector;
    span.dataset.name = obj.name;
    span.dataset.capture;

    span.classList.add("collectGroup", "noSelect");
    nametag.classList.add("savedSelector", "noSelect");
    deltog.classList.add("deltog", "noSelect");

    span.appendChild(nametag);
    span.appendChild(deltog);

    nametag.textContent = obj.name;
    deltog.innerHTML = "&times;"

    nametag.addEventListener("mouseenter", previewSavedRule, false);
    nametag.addEventListener("mouseleave", unpreviewSavedRule, false);
    deltog.addEventListener("click", deleteRuleEvent, false);
    
    return span;
}

function previewSavedRule(event){
    clearClass("queryCheck");
    clearClass("collectHighlight");
    var parent = this.parentElement,
        selector = parent.dataset.selector,
        elements = document.querySelectorAll(selector+Collect.not);
    addClass("savedPreview", elements);
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

function addParentEvent(event){
    event.preventDefault();
    Collect.setParent();
    document.getElementById("parentWrapper").style.display = "inline";
}

function removeParentEvent(event){
    event.preventDefault();
    Collect.removeParent();
    document.getElementById("parentWrapper").style.display = "none";
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

function showActive(ele){
    // if one is already shown, hide that first
    hideActive();
    var groupID = ele.dataset.for,
        group = document.getElementById(groupID);
    Collect.options.activeTab = ele;
    Collect.options.activeGroup = group;
    group.classList.add("show");
}

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

Collect.setup();

/********************
UTILITY FUNCTIONS
********************/

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
    if ( selector_object.name === '' || selector_object.selector === ''
        || selector_object.capture === '' ) {
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
function setupHostname(){
    chrome.storage.local.get("sites", function setupHostnameChrome(storage){
        var host = window.location.hostname;
        if ( ! storage.sites[host] ) {
            storage.sites[host] = {
                rules: {},
                indices: {}
            };
            chrome.storage.local.set({'sites': storage.sites});
        }        
    });
}

function saveRule(rule){
    chrome.storage.local.get('sites', function saveRuleChrome(storage){
        var host = window.location.hostname,
            site = storage.sites[host],
            name = rule.name;
        site.rules[name] = rule;
        storage.sites[host] = site;
        chrome.storage.local.set({'sites': storage.sites});
    });
}

function deleteRule(name){
    chrome.storage.local.get('sites', function deleteRuleChrome(storage){
        var host = window.location.hostname,
            sites = storage.sites;
        delete sites[host].rules[name];
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
    ele.classList.remove('queryCheck', 'collectHighlight');
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

