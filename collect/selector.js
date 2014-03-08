/********************
    SELECTORFAMILY
********************/
/*
ele is the child element you want to build a selector from
parent is the most senior element you want to build a selector up to
*/
function SelectorFamily(ele, parent){
    this.parent = parent || document.body;
    this.selectors;
    this.ele = document.createElement("div");
    this.ele.classList.add("selectorFamily", "noSelect");
    this.buildFamily(ele);
}

/*
Populates the selectors array with Selectors from ele to parent (ignoring document.body)
Order is from most senior element to provided ele
*/
SelectorFamily.prototype.buildFamily = function(ele){
    var stopAt = this.parent,
        sel;
    // reset selectors before generating
    this.selectors = [];
    while ( ele !== null && ele !== stopAt ) {
        this.selectors.push(new Selector(ele));
        ele = ele.parentElement;
    }
    this.selectors.reverse();
    for ( var i=0, len=this.selectors.length; i<len; i++ ) {
        sel = this.selectors[i];
        this.ele.appendChild(sel.ele);
    }
    this.selectors[this.selectors.length-1].setAll();
};

SelectorFamily.prototype.removeElement = function(index){
    this.selectors.splice(index, 1);
}

/*
Turn on Fragments that match
*/
SelectorFamily.prototype.matchSelector = function(selector){
    var copy = this.selectors.slice(0, this.selectors.length),
        selectorParts = selector.split(' '),
        currSelector, currPart;

    currSelector = copy.pop();
    currPart = selectorParts.pop();

    while ( currSelector !== undefined && currPart !== undefined) {
        if ( currSelector.matches(currPart) ) {
            currPart = selectorParts.pop();
        }
        currSelector = copy.pop();
    }
}

SelectorFamily.prototype.toString = function(){
    var selectors = [],
        selectorString;
    for ( var i=0, len=this.selectors.length; i<len; i++ ) {
        selectorString = this.selectors[i].toString();
        if ( selectorString !== "" ) {
            selectors.push(selectorString);
        }
    }
    return selectors.join(' ');
}

/***************************
Functions shares by Fragment and PseudoFragment
***************************/
var fragments = {
    on: function(){
        return !this.ele.classList.contains("off");    
    },
    turnOn: function(){
        this.ele.classList.remove("off");
    },
    turnOff: function(){
        this.ele.classList.add("off");
    }
}

function toggleOff(event){
    this.classList.toggle("off");    
}

/********************
    FRAGMENT
********************/
function Fragment(name, on){
    this.name = name;
    this.ele = document.createElement("span");
    this.ele.classList.add("toggleable", "realselector", "noSelect");
    if ( !on ) {
        this.ele.classList.add("off");
    }
    this.ele.textContent = this.name;
    this.ele.addEventListener("click", toggleOff, false);
}
Fragment.prototype.on = fragments.on;
Fragment.prototype.turnOn = fragments.turnOn;
Fragment.prototype.turnOff = fragments.turnOff;
Fragment.prototype.matches = function(name){
    return name === this.name;
}

/********************
    PSEUDOFRAGMENT
********************/
function PseudoFragment(text, on){
    this.ele = document.createElement("span");
    this.ele.classList.add("toggleable", "noSelect");
    this.ele.innerHTML = text;
    // default to
    if ( on === false ) {
        this.ele.classList.add("off");
    }
    this.ele.addEventListener("click", toggleOff, false);
}
PseudoFragment.prototype.on = fragments.on;
PseudoFragment.prototype.turnOn = fragments.turnOn;
PseudoFragment.prototype.turnOff = fragments.turnOff;
PseudoFragment.prototype.matches = function(text){
    return this.ele.textContent === text;
}

/********************
    SELECTOR
********************/
function Selector( ele ){
    this.tag = new Fragment(ele.tagName.toLowerCase());
    this.id = ele.hasAttribute('id') ? new Fragment('#' + ele.getAttribute('id')) : undefined;
    this.classes = [];
    for ( var i=0, len=ele.classList.length; i<len; i++ ) {
        var curr = ele.classList[i];
        if ( curr === "collectHighlight" || curr === "queryCheck" ) {
            continue;
        }
        this.classes.push(new Fragment('.' + curr));
    }
    this.setupElements();
}

Selector.prototype.addNthofType = function(){
    if ( this.nthoftype ) {
        return;
    }
    this.nthoftype = new PseudoFragment(":nth-of-type(<span class='child_toggle noSelect' title='options: an+b " + 
        "(a & b are integers), a positive integer (1,2,3...), odd, even' contenteditable='true'>1</span>)");
    var selectors = this.ele.getElementsByClassName("realselector");
        len = selectors.length;
    this.ele.removeChild(this.nthtypeCreator);
    this.nthtypeCreator = undefined;
    this.ele.insertBefore(this.nthoftype.ele, selectors[len-1].nextSibling);
}

Selector.prototype.setupElements = function(){
    var curr,
        nthtype, onlylchild, deltog;
    this.ele = document.createElement("div");
    this.ele.classList.add("selectorGroup", "noSelect");
    this.ele.appendChild(this.tag.ele);
    if ( this.id ) {
        this.ele.appendChild(this.id.ele);
    }
    for ( var i=0, len=this.classes.length; i<len; i++ ) {
        curr = this.classes[i];
        this.ele.appendChild(curr.ele);
    }
    div = document.createElement("div");
    this.nthtypeCreator = selectorSpan("+t", ["nthtype"], "add the nth-of-type pseudo selector"),
    //this.onlychildCreator = selectorSpan(">", ["onlychild"], "next selector must be direct child (> in css)"),
    deltog = selectorSpan("x", ["deltog"]);
    this.ele.appendChild(this.nthtypeCreator);
    //this.ele.appendChild(this.onlychildCreator);
    this.ele.appendChild(deltog);
    this.nthtypeCreator.addEventListener('click', createNthofType.bind(this), false);
}

Selector.prototype.setAll = function(bool){
    if ( bool === true || bool === undefined ) {
        if ( this.id ) {
            this.id.ele.classList.remove("off");
        }
        this.tag.ele.classList.remove("off");
        for ( var i=0, len=this.classes.length; i<len; i++ ) {
            this.classes[i].ele.classList.remove("off");
        }
    } else {
        if ( this.id ) {
            this.id.ele.classList.add("off");
        }
        this.tag.ele.classList.add("off");
        for ( var i=0, len=this.classes.length; i<len; i++ ) {
            this.classes[i].ele.classList.add("off");
        }
    }
}

/*
Given a selector string, return true if the Selector has attributes matching the query string
If returning true, also turn on the matching Fragments
*/
Selector.prototype.matches = function(selector){
    var tag, id, classes, nthoftype,
        onlist = [];

    // element tag
    tag = selector.match(/^[a-z][\w0-9-]*/i);
    if ( tag !== null) {
        if ( this.tag.matches(tag[0]) ){
            onlist.push(this.tag);
        } else {
            return false;
        }
    }

    // element id
    id = selector.match(/#(?:[a-z][\w0-9-]*)/i)
    if ( id !== null ) {
        if ( this.id === undefined || !this.id.matches(id[0])) {
            return false;
        } else {
            onlist.push(this.id);
        }
    }

    // element classes
    classes = selector.match(/(\.[a-z][\w0-9-]*)/ig)
    if ( classes !== null ) {
        // if the provided selector has more classes than the selector, know it doesn't match
        if ( classes.length > this.classes.length ) {
            return false;
        }
        var thisClass, matchClass, found;
        for ( var j=0, matchLen=classes.length; j<matchLen; j++ ) {
            matchClass = classes[j];
            found = false;
            for ( var i=0, thisLen=this.classes.length; i<thisLen; i++ ) {    
                thisClass = this.classes[i];
                if ( thisClass.matches(matchClass) ) {
                    onlist.push(thisClass);
                    found = true;
                    continue;
                }
            }
            if ( !found ) {
                return false;
            }
        }
    }

    // nth-of-type element
    nthoftype = selector.match(/:nth-of-type\((?:odd|even|-?\d+n(?:\s*(?:\+|-)\s*\d+)?|\d+)\)/i);
    if ( nthoftype !== null ) {
        if ( this.nthoftype === undefined || !this.nthoftype.matches(nthoftype[0]) ){
            return false;
        } else {
            onlist.push(this.nthoftype);
        }
    }

    // everything matches, turn framents on and return true
    for ( var i=0, len=onlist.length; i<len; i++ ) {
        onlist[i].turnOn();
    }
    return true;
}

Selector.prototype.toString = function(){
    var selector = "",
        curr;
    if ( this.tag.on() ) {
        selector += this.tag.name;
    }
    if ( this.id && this.id.on() ) {
        selector += this.id.name;
    }
    if ( this.classes.length ) {
        for ( var i=0, len=this.classes.length; i<len; i++ ) {
            curr = this.classes[i];
            if ( curr.on() ) {
                selector += curr.name;
            }
        }
    }
    if ( this.nthoftype && this.nthoftype.on() ) {
        selector += this.nthoftype.ele.textContent;
    }
    return selector;
}

function createNthofType(event){
    event.stopPropagation();
    this.addNthofType();
}

/*********************************
            Helpers
*********************************/
function selectorSpan(text, classes, title){
    var span = document.createElement("span");
    span.textContent = text;
    span.classList.add(classes);
    if ( title ) {
        span.setAttribute("title", title);
    }
    return span;
}
