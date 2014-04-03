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
    rules: {},
    ruleGroups: {},
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
        addInterface();
        this.html = {
            family: document.getElementById("selectorHolder"),
            text: document.getElementById("selectorText"),
            parent: document.getElementById("parentSelector")
        };
        // make sure there is a rules object for the current hostname
        setupHostname();
        this.loadSavedItems();
        this.turnOn();
        this.interfaceEvents();
        this.bubbleEvents();
    },
    loadSavedItems: function(){
        // set the default group to attach to
        this.ruleGroups.default = document.querySelector("#savedRuleHolder .ruleGroup[data-selector=default] .groupRules");
        chrome.storage.local.get('sites', function loadRulesChrome(storage){
            var host = window.location.hostname,
                site = storage.sites[host],
                rules = site.rules;
            if ( rules ) {
                // rules
                Collect.rules = rules;
                for (var key in Collect.rules){
                    addRule(Collect.rules[key]);                    
                }
            }

            if ( site.indices[window.location.href] ) {
                Collect.indexPage= true;
                document.getElementById("indexTab").classList.add("set");
                document.getElementById("addIndex").checked = true;
                document.getElementById("parentTab").classList.remove("hidden");
            }
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
    div.innerHTML = {{src/collect.html}};
    
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
            tab = document.getElementById("indexTab");
        // adding
        if ( !tab.classList.contains("set")) {
            // set right away, remove if there is an error
            tab.classList.add("set");
            storage.sites[host].indices[url] = true;
        }
        // removing
        else {
            // remove right away, reset if there is an error
            tab.classList.remove("set");
            if ( storage.sites[host].indices[url] ) {
                delete storage.sites[host].indices[url];    
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
            site = storage.sites[host];
        chrome.runtime.sendMessage({'type': 'upload', data: site});        
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
        holder = Collect.ruleGroups.default;
    }

    ruleElement = ruleHTML(rule);
    holder.appendChild(ruleElement);
}

/*
check if there is a ruleGroup for a rule's parent element, creates one and caches it if it doesn't exist
returns an element for all rules with the same parent to append to
*/
function ruleHolderHTML(name){
    var group, div, h2;
    // check if group is cached, 
    if ( Collect.ruleGroups[name] ) {
        div = Collect.ruleGroups[name];
    } else {
        group = document.querySelector('.ruleGroup[data-selector="' + name + '"]');    
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

            Collect.ruleGroups[name] = div;

            document.getElementById("savedRuleHolder").appendChild(group);
        }
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
the object contains:
    site: hostname of the site
    rules: object containing rule objects
    indices: object with keys as urls for index pages
*/
function setupHostname(){
    chrome.storage.local.get("sites", function setupHostnameChrome(storage){
        var host = window.location.hostname;
        if ( !storage.sites[host] ) {
            storage.sites[host] = {
                site: host,
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

