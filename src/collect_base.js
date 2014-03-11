"use strict";
/*********************************
            SELECTORHOLDER
*********************************/
var SelectorHolder = {
    /*
    relevant html elements
    */
    family: undefined,
    parentSelector: undefined,
    eles: [],
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
    setup SelectorHolder interface given a SelectorFamily object
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
    },
    clearFamily: function(){
        this.family = undefined;
        while (this.html.family.lastChild) {
            this.html.family.removeChild(this.html.family.lastChild);
        }
        this.html.text.textContent = '';
    },
    /*
    set the text of the SelectorFamily's selector string in the interface
    */
    updateSelectorText: function(){
        var selectorString = (this.parentSelector ? this.parentSelector + " ": "") + this.selector();
        this.html.text.textContent = selectorString;
    },
    /*
    sets SelectorHolder.parent, stores the selector in parentSelector and turns on events for only    
    the elements whose parent is the first element matching the selector
    */
    setParent: function(){
        this.parentSelector = this.selector();
        if ( this.parentSelector  === "") {
            this.parentSelector = undefined;
            return;
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
            return {
                count: elements.length,
                first: elements[0]
            };
        } else {
            return {
                count: 0,
                first: undefined
            };
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
        document.getElementById("setParent").addEventListener("click", function(event){
            SelectorHolder.setParent();
        }, false);
        document.getElementById("removeParent").addEventListener("click", function(event){
            SelectorHolder.removeParent();
        }, false);
        document.getElementById('closeCollect').addEventListener('click', removeInterface, false);
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
                SelectorHolder.updateSelectorText();
                SelectorHolder.testSelector();    
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
                        SelectorHolder.family.removeElement(i);
                        break;
                    }
                }
                SelectorHolder.updateSelectorText();
                SelectorHolder.testSelector();
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
    div.innerHTML = "{{src/collect.html}}";
    
    document.body.appendChild(div);
    addNoSelect(div.querySelectorAll("*"));
}

/******************
    EVENTS
******************/
function createSelectorFamily(event){
    event.stopPropagation();
    event.preventDefault();
    var family = new SelectorFamily(this, SelectorHolder.parentSelector);
    SelectorHolder.setFamily(family);
}

function highlightElement(event){
    this.classList.add("collectHighlight");
}

function unhighlightElement(event){
    this.classList.remove("collectHighlight");
}

function removeInterface(event){
    event.stopPropagation();
    SelectorHolder.turnOff();
    clearClass('queryCheck');
    clearClass('collectHighlight');
    var elesToRemove = ["collectjs"],
        curr;
    for ( var i=0, len=elesToRemove.length; i<len; i++ ) {
        curr = document.getElementById(elesToRemove[i]);
        curr.parentElement.removeChild(curr);
    }
}


SelectorHolder.setup();

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

/*

stuff that can possibly be reused

// rules for #form_buttons
document.getElementById('collect_save').addEventListener('click', saveRuleEvent, false);
document.getElementById('collect_clear_form').addEventListener('click', clearRuleForm, false);
document.getElementById('collect_preview').addEventListener('click', previewRule, false);

// group events
document.getElementById('collect_selectors').addEventListener('click', deleteRuleEvent, false);
document.getElementById('collect_preview_saved').addEventListener('click', previewGroupEvent, false);
document.getElementById('collect_new_group').addEventListener('click', createGroupEvent, false);
document.getElementById('collect_get_groups').addEventListener('click', getGroupsEvent, false);
document.getElementById('collect_delete_group').addEventListener('click', deleteGroupEvent, false);
document.getElementById('collect_upload_group').addEventListener('click', uploadGroupEvent, false);
document.getElementById('collect_selector_groups').addEventListener('change', loadGroupEvent, false);


//Event Functions

// close the collect interface
function removeInterface(event){
    event.stopPropagation();
    collect.events.off();
    clearClass('queryCheck');
    clearClass('collectHighlight');
    clearClass('saved_preview');
    // closing, so re-clicking default_icon should create interface again
    window.collectMade = false;
    var elesToRemove = ['collect_interface', 'options_interface', 'options_background',
        'preview_interface', 'preview_background'],
        curr;
    for ( var i=0, len=elesToRemove.length; i<len; i++ ) {
        curr = document.getElementById(elesToRemove[i]);
        curr.parentElement.removeChild(curr);
    }
}

// create and save an object for the current query selector/capture data
function saveRuleEvent(event){
    event.preventDefault();
    var inputs = document.getElementById('selector_form').getElementsByTagName('input'),
        selector_object = {},
        active = document.getElementsByClassName('active_selector')[0],
        group = currentGroup();
        
    for ( var p=0, len=inputs.length; p<len; p++ ) {
        var curr = inputs[p],
            name = curr.getAttribute('name'),
            value = curr.value;
        selector_object[name] = value;
    }

    // active isn't undefined if you're editing an already saved selector
    if ( active ){
        saveRule(group, selector_object);

        // modify name, selector, and capture but not index
        active.dataset.selector = selector_object.selector;
        active.dataset.capture = selector_object.capture;
        active.textContent = selector_object.name;
        active.classList.remove('active_selector');

        selector_object = selectorIsComplete(selector_object);
        if ( !selector_object.incomplete ) {
            swapClasses(active, 'incomplete_selector', 'saved_selector');
        } else {
            swapClasses(active, 'saved_selector', 'incomplete_selector');
        }
    } else {
        saveRule(group, selector_object);
        // call last because index needs to be set
        document.getElementById('collect_selectors').innerHTML += savedSelectorHTML(selector_object);
    }
    clearInterface();
}

// output a preview of current selector form values to the preview modal
function previewRule(event){
    event.preventDefault();
    var selector = document.getElementById('selector_string').value,
        eles = selectorElements(selector),
        type = document.getElementById('selector_capture').value,
        outString = '',
        attr;
    if ( selector === '' || type === '' ) {
        outString = "No attribute to capture";
    } else if ( type === 'text' ) {
        for (var i=0, len=eles.length; i<len; i++ ) {
            outString += "<p>" + (eles[i].textContent) + "</p>";
        }
    } else if ( type.indexOf('attr-') === 0 ) {
        // get everything after attr-
        attr = type.slice(type.indexOf('-')+1);
        for (var i=0, len=eles.length; i<len; i++ ) {
            outString += "<p>" + (eles[i].getAttribute(attr)) + "</p>";
        }
    }
    document.getElementById('preview_holder').innerHTML = outString;
    $("#preview_interface, #preview_background").show();
}


function clearRuleForm(event){
    event.preventDefault();
    clearInterface();
}

// remove selector rule from localstorage
function deleteRuleEvent(event){
    event.stopPropagation();
    if ( hasClass(event.target, 'deltog')){
        var ele = event.target,
            selector_span = ele.previousElementSibling,
            selector_name = selector_span.innerHTML,
            selector_group = $(ele).parents('.collect_group');
        if ( $("#safedelete").is(":checked") ) {
            var verifyDelete = confirm("Confirm you want to delete rule \"" + selector_name + "\"");
            if ( !verifyDelete ) {
                return;
            }
        }
        if ( selector_span.classList.contains('active_selector')) {
            clearInterface();
        }
        selector_group.remove();
        deleteRule(currentGroup(), selector_name);
    }
}

// load saved selector information into the #selector_form for editing
function clearOrLoad(event){
    event.stopPropagation();
    var ele = event.target
    if ( hasClass(ele, 'saved_selector') ) {
        if ( hasClass(ele, 'active_selector') ) {
            clearInterface();
        } else {
            loadSelectorGroup(ele);
        }
    }
    
}

// sets the fields in the #selector_form given an element 
// that represents a selector
function loadSelectorGroup(ele){
    var selectorVal = ele.dataset.selector || '',
        selector = decodeURIComponent(selectorVal.replace(/\+/g, ' ')),
        family = Collect.selectors.buildFamily(selector);

    document.getElementById('selector_name').value = ele.textContent || '';
    document.getElementById('selector_capture').value = ele.dataset.capture || '';
    document.getElementById('selector_index').value = ele.dataset.index || '';

    clearClass('active_selector');
    ele.classList.add('active_selector');
    updateInterface(selector)
}

function previewSavedSelector(event){
    if ( hasClass(event.target, 'saved_selector')){
        clearClass("queryCheck");
        var ele = event.target,
            selector = ele.dataset.selector;
        addClass("queryCheck", document.querySelectorAll(selector));
    }
}

function unpreviewSavedSelector(event){
    if ( hasClass(event.target, 'saved_selector')){
        clearClass("queryCheck");
        updateInterface();
    }   
}

function previewGroupEvent(event){
    event.preventDefault();
    clearInterface();
    var outString = '';
    chrome.storage.local.get('rules', function previewGroupChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            group = rules[host][currentGroup()],
            curr, results, resultsLen, prop;

        for( var key in group ) {
            curr = group[key];
            // make sure to only run on completed rules
            curr = selectorIsComplete(curr);
            if ( !curr.incomplete) {
                results = document.querySelectorAll(curr.selector);
                resultsLen = results.length;
                prop = captureFunction(curr);
                outString += "<div class='preview_group'><h2>" + curr.name + 
                    "(Count: " + resultsLen + ")</h2><ul>";
                for (var r=0; r<resultsLen; r++ ) {
                    var ele = results[r];
                    ele.classList.add("saved_preview");
                    outString += "<li>" + prop(ele) + "</li>";
                }
                outString += "</ul></div>";
            }
        }
        document.getElementById('preview_holder').innerHTML = outString;
        $("#preview_interface, #preview_background").show();
    });
}
*/
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
function createGroupEvent(event){
    event.preventDefault();
    var name = prompt("Group Name");
    if ( name !== null && name !== '' ){
        addGroup(name);
        document.getElementById('collect_selectors').innerHTML = '';
        clearInterface();
    }
}

function deleteGroupEvent(event){
    event.preventDefault();
    var name = currentGroup();
    if ( name !== 'default' ) {
        if ( $("#safedelete").is(":checked") ) {
            var verifyDelete = confirm("Confirm you want to delete group \"" + name + "\"");
            if ( !verifyDelete ) {
                return;
            }
        }
        $('#collect_selector_groups option:selected').remove();
        chrome.storage.local.get('rules', function deleteGroupChrome(storage){
            var host = window.location.hostname,
                rules = storage.rules;
            delete rules[host][name];
            chrome.storage.local.set({'rules': rules});
            loadSavedSelectors();
        });    
    } else {
        var clearRules = confirm("Cannot delete 'default' group, clear rules instead?");
        if ( clearRules ) {
            chrome.storage.local.get('rules', function clearDefaultGroup(storage){
                var host = window.location.hostname,
                    rules = storage.rules;
                rules[host][name] = {};
                chrome.storage.local.set({'rules': rules});
                loadSavedSelectors();
            });    
        }
    }
    
}

function getGroupsEvent(event){
    chrome.runtime.sendMessage({'type': 'groups'}, function getGroupsChrome(response){
        if ( !response.error ){
            addLoadedGroups(response.groups);
        }
    });
}

function uploadGroupEvent(event){
    event.preventDefault();
    chrome.storage.local.get('rules', function uploadGroupChrome(storage){
        var host = window.location.hostname,
            rules = storage.rules,
            groupName = currentGroup(),
            group = rules[host][groupName],
            uploadObject = {
                'host': host,
                'name': groupName,
                'rules': {}
            },
            uploadGroups = {},
            uploadJSON, curr;
        // don't upload if the rule hasn't been completed
        for ( var key in group ) {
            curr = group[key];
            if ( !curr.incomplete ) {
                uploadObject.rules[key] = group[key];
            }
        }
        uploadJSON = JSON.stringify(uploadObject);
        chrome.runtime.sendMessage({'type': 'upload', 'msg': uploadJSON});
    });
}

function loadGroupEvent(event){
    loadSavedSelectors();
    clearInterface();
}

function select(event){
    event.stopPropagation();
    clearClass('collectHighlight');
    this.classList.add('collectHighlight');
}

function deselect(event){
    event.stopPropagation();
    this.classList.remove('collectHighlight');
}


//when an element is clicked, setup interface data using clicked element
function querySelector(event){
    event.stopPropagation();
    event.preventDefault();
    if ( this === null ) {
        return;
    }
    if ( !document.getElementsByClassName('.active_selector').length ){
        clearInterface();
    }

    var family = new SelectorFamily(this)
}

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
function getRules(callback){
    chrome.storage.local.get('rules', callback);
}

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

