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
    options: {
        activeTab: undefined,
        activeGroup: undefined
    },
    /*
    create a SelectorFamily given a css selector string
    */
    buildFamily: function(selector){
        var prefix = this.parentSelector ? this.parentSelector : "body",
            element = document.querySelector(prefix + " " + selector);
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
        this.eles = document.querySelectorAll(prefix + " *:not(.noSelect)");
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
    returns the first element matching the current selector as well as how many total elements
    match the selector string
    */
    testSelector: function(){
        var selectorString = this.selector();
        clearClass("queryCheck");
        if ( selectorString !== "" ) {
            var prefix = this.parentSelector ? this.parentSelector : "body",
                elements = document.querySelectorAll(prefix + " " + selectorString);
            for ( var i=0, len=elements.length; i<len; i++ ) {
                elements[i].classList.add("queryCheck");
            }
            document.getElementById("selectorCount").textContent = "Count: " + elements.length;
        } else {
            document.getElementById("selectorCount").textContent = "";
        }
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
        this.turnOn();
        this.interfaceEvents();
        this.bubbleEvents();
    },
    interfaceEvents: function(){
        // preview
        document.getElementById("clearSelector").addEventListener('click', removeSelectorEvent, false);
        document.getElementById("addParent").addEventListener("click", addParentEvent, false);
        document.getElementById("saveSelector").addEventListener("click", saveSelector, false);

        // rule preview
        document.getElementById("ruleBackground").addEventListener("click", hideRuleModal, false);

        // tabs
        addEvents(document.querySelectorAll("#collectTabs .toggle"), 'click', toggleTab);
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
    div.innerHTML = "<div id=\"collectMain\">    <div id=\"selectorHolder\"></div></div><div id=\"selectorPreview\" class=\"topbar\"><span id=\"selectorText\"></span><span id=\"selectorCount\"></span><div id=\"selectorButtons\"><button id=\"saveSelector\">Save</button><button id=\"clearSelector\">Clear</button><button id=\"addParent\" title=\"Use the current selector as a parent selector\">Parent</button></div></div><div id=\"collectOptions\" class=\"topbar\"><div id=\"collectTabs\">    <div class=\"tab\">    <span>Parent</span>    <section id=\"parentWrapper\">    <span id=\"parentSelector\"></span>    <button id=\"removeParent\">X</button>    </section>    </div>    <div class=\"tab toggle\" id=\"ruleTab\" data-for=\"ruleGroup\">Rules</div>    <div class=\"tab toggle\" id=\"optionTab\" data-for=\"optionGroup\">Options</div>    <div class=\"tab\" id=\"closeCollect\" title=\"remove parent selector\">x</div></div><div id=\"tabGroups\">    <div id=\"optionGroup\">    </div>    <div id=\"ruleGroup\">    </div></div></div><div id=\"ruleHolder\"><div id=\"ruleBackground\"></div><div id=\"ruleModal\"><div id=\"rulePreview\"></div></div></div>";
    
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

function saveSelector(event){
    var selector = Collect.selector(),
        ele = document.querySelector(selector),
        html;
    if ( ele ) {
        html = selectorTextHTML(ele)
        document.getElementById("rulePreview").innerHTML = html;
        document.getElementById("ruleHolder").style.display = "block";
    }
}

function hideRuleModal(event){
    document.getElementById("ruleHolder").style.display = "none";
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

/*********** OLD STUFF ***************/

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

function captureFunction(curr){
    if (curr.capture==="text") { 
        return function(ele){
            return ele.textContent;
        };
    } else if (curr.capture.indexOf("attr-")===0) {
        // return substring after first hyphen so that it works with data- attributes
        var attribute = curr.capture.slice(curr.capture.indexOf("-")+1);
        return function(ele){
            return ele.getAttribute(attribute);
        };
    }
}
/*
//GROUPS

//create option elements for each of the groups for the current site
function loadGroups(){
    chrome.storage.local.get('rules', function loadGroupsChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            groups = rules[host],
            parent = document.getElementById('collect_selector_groups');
        // instantiate if it doesn't exist
        if ( groups === undefined ) {
            rules[host] = {'default': {}};
            chrome.storage.local.set({'rules': rules});
            groups = rules[host];
        }
        for ( var key in groups ) {
            parent.appendChild(newGroupOption(key));
        }
        loadSavedSelectors();
    });
}

function loadSavedSelectors(){
    chrome.storage.local.get('rules', function loadSavedChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            groupName = currentGroup(),
            group = rules[host][groupName],
            selectors = '';
        for ( var key in group ) {
            selectors += savedSelectorHTML(group[key]);
        }
        document.getElementById('collect_selectors').innerHTML = selectors;
    })
}

function addGroup(name){
    chrome.storage.local.get('rules', function addGroupChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            groups = rules[host],
            parent = document.getElementById('collect_selector_groups');
        // don't override if it already exists
        if ( groups[name] === undefined ) {
            rules[host][name] = {}
            chrome.storage.local.set({'rules': rules});
            parent.appendChild(newGroupOption(name, true));
        }
    });
}
//get the option element that is currently selected
function currentGroup(){
    var groups = document.getElementById('collect_selector_groups'),
        opts = groups.getElementsByTagName('option'),
        curr;
    for ( var i=0, len=opts.length; i<len; i++ ){
        curr = opts[i];
        if ( curr.selected ) {
            return curr.value;
        }
    }
    return '';
}

function newGroupOption(name, selected){
    var option = document.createElement('option');
    if ( selected ) {
        option.setAttribute('selected','selected');
    }
    option.innerHTML = name;
    option.setAttribute('value', name);
    return option;
}

//    STORAGE
//create the group and add the rules
//currently overrides if there is an existing group with that name
function addLoadedGroups(groups){
    chrome.storage.local.get('rules', function setLoadedRules(storage){
        var host = window.location.hostname,
            parent = document.getElementById('collect_selector_groups'),
            len = groups.length,
            selectors = '',
            groupRules, curr, currName, currRules, rule;

        for ( var i=0; i<len; i++ ) {
            curr = groups[i];
            currName = curr.name;
            currRules = curr.rules;
            groupRules = storage.rules[host][currName];
            // only create group if it doesn't already exist
            if ( groupRules === undefined ) {
                groupRules = {};
                // set select option to selected for first group
                parent.appendChild(newGroupOption(currName, (i===0)));
            }           

            for ( var r=0, rulesLen=currRules.length; r<rulesLen; r++ ) {
                rule = {
                    'name': currRules[r],
                    'capture': '',
                    'selector': '',
                    'index': ''
                };
                rule.incomplete = true;
                groupRules[rule.name] = rule;
                if ( i === 0 ) {
                    selectors += savedSelectorHTML(rule);
                }    
            }
            storage.rules[host][currName] = groupRules;
        }
        document.getElementById('collect_selectors').innerHTML = selectors;
        chrome.storage.local.set({'rules': storage.rules});
    });
}

function saveRule(group, rule){
    chrome.storage.local.get('rules', function saveRuleChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            name = rule.name;
        rules[host][group][name] = rule;
        chrome.storage.local.set({'rules': rules});
    });
}

function deleteRule(group, name){
    chrome.storage.local.get('rules', function deleteRuleChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules;
        delete rules[host][group][name];
        chrome.storage.local.set({'rules': rules});
    });  
}
*/
//GENERAL HTML RETURNING FUNCTIONS
// add interactive identifier for saved selectors
function savedSelectorHTML(obj){
    obj = selectorIsComplete(obj);
    return '<span class="collect_group no_select">' + 
        '<span class="' + (obj.incomplete ? 'incomplete_selector' : 'saved_selector') +
        ' no_select" data-selector="' + obj.selector + 
        '" data-capture="' + obj.capture + '" data-index="' + obj.index + '"">' + obj.name + 
        '</span><span class="deltog no_select">x</span></span>';
}

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

