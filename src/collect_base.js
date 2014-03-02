// check to make sure an interface hasn't already been created
if ( !window.collectMade ) {
    "use strict";
    var collect = {
        elements: "body *:not(.no_select)",
        ignoreSelectors: {'.clearfix':true},
        eventsOn: false,
        events: {
            permanent: function(){
                // #control_buttons
                document.getElementById('off_button').addEventListener('click', toggleEvents, false);
                document.getElementById('close_selector').addEventListener('click', removeInterface, false);
                document.getElementById('move_position').addEventListener('click', moveInterface, false);

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
            },
            on: function(){
                collect.eventsOn = true;
                document.getElementById('selector_text').addEventListener('click', setCaptureVal, false);
                document.getElementById('selector_index').addEventListener('blur', blurUpdate, false);
                document.getElementById('collect_selectors').addEventListener('click', clearOrLoad, false);

                var selectorParts = document.getElementById('selector_parts');
                selectorParts.addEventListener('click', stopPropagation, false);
                selectorParts.addEventListener('click', toggleOff, false);
                selectorParts.addEventListener('click', removeSelectorGroup, false);
                selectorParts.addEventListener('click', addPseudoType, false);
                selectorParts.addEventListener('click', addOnlyChildren, false);

                $('#selector_parts')
                    .on('blur', '.child_toggle', verifyPseudoVal)
                    .on('mouseenter', '.selector_group', previewSelectorHover)
                    .on('mouseleave', '.selector_group', removeSelectorHover)

                $(collect.elements).on({
                    mouseenter: select,
                    mouseleave: deselect,
                    click: querySelector
                });
            },
            off: function(){
                collect.eventsOn = false;
                document.getElementById('selector_text').removeEventListener('click', setCaptureVal);
                document.getElementById('selector_index').removeEventListener('blur', blurUpdate);
                document.getElementById('collect_selectors').removeEventListener('click', clearOrLoad);

                var selectorParts = document.getElementById('selector_parts');
                selectorParts.removeEventListener('click', stopPropagation);
                selectorParts.removeEventListener('click', toggleOff);
                selectorParts.removeEventListener('click', removeSelectorGroup);
                selectorParts.removeEventListener('click', addPseudoType);
                selectorParts.removeEventListener('click', addOnlyChildren);
                
                $('#selector_parts')
                    .off('blur', '.child_toggle', verifyPseudoVal)
                    .off('mouseenter', '.selector_group', previewSelectorHover)
                    .off('mouseleave', '.selector_group', removeSelectorHover)

                $(collect.elements).off({
                    mouseenter: select,
                    mouseleave: deselect,
                    click: querySelector
                });
            }
        },
        /***
        add the interface and turn on events
        ***/
        setup: function(){
            addInterfaceModal();
            this.events.permanent();
            this.events.on();
        }
    };
    collect.setup();

    /*************
    Event Functions
    *************/
    // turn off events for highlighting/selecting page elements
    function toggleEvents(event){
        event.stopPropagation();
        if ( collect.eventsOn ) {
            collect.events.off();
            this.textContent = 'Turn On';
            swapClasses(this, 'con', 'pro');
            clearClass('query_check');
            clearClass('collect_highlight');
            clearClass('saved_preview');
        } else {
            collect.events.on();
            this.textContent = 'Turn Off';
            swapClasses(this, 'pro', 'con');
        }
    }

    // close the collect interface
    function removeInterface(event){
        event.stopPropagation();
        collect.events.off();
        clearClass('query_check');
        clearClass('collect_highlight');
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

    // toggle interface between top and bottom of screen
    function moveInterface(event){
        event.stopPropagation();
        var collect_interface = document.getElementById('collect_interface');
        if ( hasClass(collect_interface, 'attach_top') ) {
            swapClasses(collect_interface, 'attach_top', 'attach_bottom');
            this.textContent = 'Move to Top';
        } else {
            swapClasses(collect_interface, 'attach_bottom', 'attach_top');
            this.textContent = 'Move to Bottom';
        }
    }

    // select which attribute (or text) to capture desired data from query selected elements
    function setCaptureVal(event){
        if ( hasClass(event.target, 'capture') ) {
            document.getElementById('selector_capture').value = event.target.dataset.capture;    
        }
    }

    function stopPropagation(event){
        if ( hasClass(event.target, 'child_toggle')){
            event.stopPropagation();    
        }
    }

    function verifyPseudoVal(event){
        event.stopPropagation();
        // verify that nth-of-type is legitimate input
        var ele = event.target,
            text = ele.textContent.toLowerCase(),
            /* matches nth-of-type selectors:
                odd, even, positive integers, an+b, -an+b
            */
            child_match = /^(?:odd|even|-?\d+n(?:\s*(?:\+|-)\s*\d+)?|\d+)$/;
        if ( text.match(child_match) === null ) {
            // if input is bad, reset to 1 and turn the selector off
            ele.textContent = 1;
            ele.parentElement.classList.add('off');
        }
        updateInterface();
    }

    function toggleOff(event){
        if ( hasClass(event.target, 'toggleable')){
            var ele = event.target,
                parent = ele.parentElement,
                pseudoElement = parent.getElementsByClassName('pseudo')[0],
                childElement = parent.getElementsByClassName('child')[0],
                toggleables = parent.getElementsByClassName('realselector'),
                toggleableCount = toggleables.length,
                offCount = 0;

            /*
            if there is a pseudo selector and all other parts of a seletor group are turned off,
            turn off the pseudo selector as well. If turning on a pseudo selector, turn on the
            first element of the group as well
            */
            // toggle .off, then count classes that are off
            ele.classList.toggle('off');
            for ( var r=0, len = toggleables.length; r<len; r++ ) {
                if ( hasClass(toggleables[r], 'off')){
                    offCount++;
                }
            }
            if ( ele !== pseudoElement && ele !== childElement ) {
                // turning it off
                if ( hasClass(ele, 'off') && toggleableCount == offCount) {
                    if ( pseudoElement ) {
                        pseudoElement.classList.add('off');
                    }
                    if ( childElement ) {
                        childElement.classList.add('off');
                    }
                }
            } else {
                if ( pseudoElement === ele  && offCount === toggleableCount ) {
                    toggleables[0].classList.remove('off');
                } else if ( childElement === ele && offCount === toggleableCount ) {
                    toggleables[0].classList.remove('off');
                }
            }
            updateInterface();    
        }
    }

    function blurUpdate(event){
        event.preventDefault();
        updateInterface();
    }

    function previewSelectorHover(event){
        var index = 0,
            ele = event.target,
            selector;
        while ( (ele=ele.previousElementSibling) !== null ) {
            index++;
        }
        // + 1 to include the hovered selector
        selector = baseSelector(index + 1);
        clearClass('collect_highlight');
        selectorElements(selector).addClass('collect_highlight');
    }

    function removeSelectorHover(event){
        clearClass('collect_highlight');
    }

    function removeSelectorGroup(event){
        if ( hasClass(event.target, 'deltog')){
            $(event.target).parents('.selector_group').remove();
            updateInterface();
        }
    }

    function addPseudoType(event){
        if ( hasClass(event.target, 'nthtype')){
            var ele = event.target,
                parent = $(ele).parents('.selector_group'),
                html = pseudoHTML('nth-of-type'),
                toggleable = parent.children('.realselector');
            parent.children('.pseudo').remove();
            toggleable.last().after($(html));
            // make sure the element is on so this selector makes sense
            toggleable.eq(0).removeClass('off');
            ele.parentElement.removeChild(ele);
            updateInterface();
        }
    }

    function addOnlyChildren(event){
        if ( hasClass(event.target, 'onlychild')){
            var ele = event.target,
                parent = $(ele).parents('.selector_group'),
                html = "<span class='child toggleable no_select'> &gt;</span>",
                toggleable = parent.children('.toggleable');
            ele.parentElement.removeChild(ele);
            
            toggleable.last().after($(html));
            // make sure the element is on so this selector makes sense
            toggleable.eq(0).removeClass('off');
            updateInterface(); 
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
            document.getElementById('collect_selectors').innerHTML += selectorHTML(selector_object);
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
                selector_name = selector_span.innerHTML;
            if ( $("#safedelete").is(":checked") ) {
                var verifyDelete = confirm("Confirm you want to delete rule \"" + selector_name + "\"");
                if ( !verifyDelete ) {
                    return;
                }
            }
            $(ele).parents('.collect_group').remove();
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
            name = ele.textContent,
            index = ele.dataset.index,
            capture = ele.dataset.capture;
        document.getElementById('selector_name').value = name;
        document.getElementById('selector_string').value = selector;
        document.getElementById('selector_capture').value = capture;
        document.getElementById('selector_index').value = index;
        if ( selector !== '' ){
            document.getElementById('selector_parts').innerHTML = accurateSelectorGroups(selector);
            clearClass("query_check");
            selectorElements(selector).addClass("query_check");
        }
        clearClass('active_selector');
        ele.classList.add('active_selector');
        updateInterface();
    }

    function accurateSelectorGroups(selector, parent){
        var ele = document.querySelector(selector),
            selectorParts = selector.split(' '),
            parseParts = [],
            html = '',
            stopParent = parent ? parent.parentElement : document.body;
            ele_selector, on, currentParse;
        for ( var i=0, len=selectorParts.length; i<len; i++ ) {
            parseParts.push(parseSelector(selectorParts[i]));
        }
        currentParse = parseParts.pop();
        // stop generating selector when you get to the body element
        if ( ele === null ) {
            alertMessage('no valid elements match selector in page');
            return '';
        }
        while ( ele !== null && ele !== stopParent ){
            on = false;
            if ( !testSelectorRules(ele) ) {
                ele = ele.parentElement;
                continue;
            }
            ele_selector = new Selector(ele);
            // check if current element matches what we're looking for
            if ( currentParse) {
                on = matchSelector(ele, currentParse);
                if ( on ) {
                    currentParse = parseParts.pop();
                }
            }

            html = ele_selector.toHTML(on) + ' ' + html;
            ele = ele.parentElement;
        }
        return html;

    }

    /*
    given a string representing a query selector, return an object containing the parts
    */
    function parseSelector(selector){
        var tagMatch = /^[a-z][\w0-9-]*/i,
            idMatch = /(?:#)([a-z][\w0-9-]*)/i,
            classMatches = /(\.[a-z][\w0-9-]*)/ig,
            // only matching ints instead of all pseudo rules
            pseudoMatch = /:nth-of-type\((?:odd|even|-?\d+n(?:\s*(?:\+|-)\s*\d+)?|\d+)\)/i
            tag = selector.match(tagMatch),
            id = selector.match(idMatch),
            classes = selector.match(classMatches),
            pseudo = selector.match(pseudoMatch),
            selectorObject = {};
        if ( tag !== null ) {
            selectorObject.tag = tag[0];
        }
        if ( id !== null ) {
            selectorObject.id = id[0];
        }
        if ( classes !== null ) {
            selectorObject.classes = classes;
        }
        if ( pseudo !== null ) {
            selectorObject.pseudo = pseudo[0];
        }
        return selectorObject;
    }

    function matchSelector(ele, selector){
        if ( (selector.tag && ele.tagName.toLowerCase() !== selector.tag ) ||
            ( selector.id && ele.getAttribute('id') !== selector.id ) ){
            return false;
        }
        if ( selector.classes ) {
            for ( var i=0, len=selector.classes.length; i<len; i++ ) {
                var curr = selector.classes[i];
                // ignore the period in the class name
                if ( !hasClass(ele, curr.substr(1))) {
                    return false;
                }
            }
        }
        return true;
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
            chrome.runtime.sendMessage({'type': 'upload', 'msg': uploadJSON}, function uploadResponseChrome(response){
                if ( response.error ) {
                    alertMessage("failed to upload");
                } else {
                    alertMessage("group successfully uploaded");
                }
            });
        });
    }

    function loadGroupEvent(event){
        loadSavedSelectors();
        clearInterface();
    }

    function select(event){
        event.stopPropagation();
        clearClass('collect_highlight');
        this.classList.add('collect_highlight');
    }

    function deselect(event){
        event.stopPropagation();
        this.classList.remove('collect_highlight');
    }

    /*
    when an element is clicked, setup interface data using clicked element
    */
    function querySelector(event){
        event.stopPropagation();
        event.preventDefault();
        if ( this === null ) {
            return;
        }
        if ( !document.getElementsByClassName('.active_selector').length ){
            clearInterface();
        }
        makeSelectorGroups(this);
    }

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

    // utility function to swap two classes
    function swapClasses(ele, oldClass, newClass){
        ele.classList.remove(oldClass);
        ele.classList.add(newClass);
    }

    // adds a div with text @msg to #collect_messages, disappears after 2 seconds
    function alertMessage(msg) {
        var modal = document.createElement('div'),
            messageHolder = document.getElementById('collect_messages');
        modal.innerHTML = msg;
        messageHolder.appendChild(modal);
        setTimeout(function(){
            messageHolder.removeChild(modal);
        }, 2000);
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
            eles[i].classList.add('no_select');
        }
    }

    function selectorIsComplete(selector_object){
        if ( selector_object.name === '' || selector_object.selector === ''
            || selector_object.capture === '' ) {
            selector_object.incomplete = true;
        }
        return selector_object;
    }   

    /********************
    INTERFACE FUNCTIONS
    ********************/

    /*
    create the collect interface, add no_select class to its elements so the interface
    doesn't interfere with itself, and add event listeners to the interface
    */
    function addInterfaceModal() {
        var interface_html = "{{src/collect.html}}",
            interfaceEles;
        document.body.innerHTML += interface_html;
        document.getElementById('collect_interface').classList.add('no_select');
        interfaceEles = document.querySelectorAll('#collect_interface *');
        addNoSelect(interfaceEles);
        
        loadGroups();
        addOptionsModal();
        addPreviewModal();
    }

    /*
    options modal and selection options
    */
    function addOptionsModal(){
        var options_html = "{{src/options.html}}",
            options_element = $(options_html),
            eles,
            optionTogglers, optionsLen;
        options_element.appendTo('body');
        
        eles = document.querySelectorAll('#options_background, #options_interface, #options_interface *');
        addNoSelect(eles);
        
        function toggleOptions(event){
            event.preventDefault();
            event.stopPropagation();
            options_element.toggle();
        }

        optionTogglers = document.querySelectorAll("#open_options, #close_options, #options_background");
        addEvents(optionTogglers, 'click', toggleOptions);
    }

    /*
    adds the preview modal html and events to the page
    */
    function addPreviewModal(){
        var preview_html = "{{src/preview.html}}",
            preview_element = $(preview_html),
            eles,
            previewTogglers, previewLen;
        preview_element.appendTo('body');
        eles = document.querySelectorAll('#preview_background, #preview_interface, #preview_interface *');
        addNoSelect(eles);

        function togglePreview(event){
            event.preventDefault();
            event.stopPropagation();
            preview_element.toggle();
            clearClass('saved_preview');
        }

        previewTogglers = document.querySelectorAll("#close_preview, #preview_background");
        addEvents(previewTogglers, 'click', togglePreview);
    }

    /*********************
        SELECTORS/RULES
    *********************/
    /*
    takes an element and applies the rules based on the options, returning true if it passes
    all requirements
    */
    function testSelectorRules(ele){
        // Include Table Elements rule
        var ignored_tags = ['TABLE', 'TBODY', 'TR','TD', 'THEAD', 'TFOOT',
            'COL', 'COLGROUP'],
            no_tables = $('#tables').is(':checked');
        if ( no_tables && ignored_tags.indexOf( ele.tagName ) > -1 ) {
            return false;
        }
        return true;
    }

    /*
    iterates over selector group elements and builds a string based on 
    toggleable elements that are not 'off'
    */
    function baseSelector(index) {
        var groups = document.querySelectorAll('#selector_parts .selector_group'),
            len = index || groups.length,
            group_text = [],
            group_selector, togChildren;
        for (var g=0; g < len; g++) {
            group_selector = '';
            togChildren = groups[g].getElementsByClassName('toggleable');
            for ( var i=0, childrenLen=togChildren.length; i<childrenLen; i++ ) {
                var curr = togChildren[i];
                // if index is undefined and element has class .off, use an empty string,
                // but when index is defined, we want all elements included
                group_selector += (hasClass(curr, 'off') && index===undefined) ? '' : curr.textContent;
            }
            if ( group_selector !== '' ) {
                group_text.push(group_selector);
            }
        }
        return group_text.join(' ');
    }

    /*
    given a selector, apply user options, exclude .no_select elements, 
    and return jquery array
    */
    function selectorElements(selector) {
        if ( $('#visible').is(':checked') ) {
            selector += ':visible';
        }
        selector += ':not(.no_select)';
        return $(selector);
    }

    /*
    uses #selector_index to exclude values from getting query_check
    positive values remove elements from beginning of the eles array
    negative values remove elements from the end of the eles array
    */
    function updateInterface(){
        var selectorCount = document.getElementById('selector_count'),
            selectorString = document.getElementById('selector_string'),
            selectorText = document.getElementById('selector_text'),
            selector = baseSelector(),
            selected;

        clearClass('query_check');
        clearClass('collect_highlight');
        document.getElementById('collect_error').innerHTML = '';
        if (selector === ''){
            selectorCount.innerHTML = '0';
            selectorString.value = '';
            selectorText.innerHTML = '';
        } else {
            selected = addQueryCheckClass( selectorElements(selector) );
            selectorCount.innerHTML = selected.length;
            selectorString.value = selector;
            selectorText.innerHTML = selectorTextHTML(selected[0]) || "no elements match selector";
        }
    }

    /*
    given an array of elements, add .query_check to each and returns the array
    if #selector_index has a value, slice array based on rules before adding class and return
    sliced array
    */
    function addQueryCheckClass(eles){
        var index = document.getElementById('selector_index').value,
            indexInt = parseInt(index, 10),
            newEles, low, high, originalLength;
        // if index is undefined, add to all elements
        if ( isNaN(indexInt) ) {
            eles.addClass("query_check");
            return eles;
        } else {
            low = 0;
            high = eles.length;
            originalLength = high;
            // if indexInt is negative, add the array length to get the desired value
            // if indexInt is >= eles.length, set 
            if ( indexInt < 0 ) {
                // modulo in case the negative number is greater than eles.length
                // because javascript negative number modulo is broken, don't need to subtract
                // the value to get the correct negative number
                high += (indexInt % high );
            } else if ( indexInt >= originalLength ) {
                low = originalLength - 1;
            } else {
                low = indexInt;
            }
            newEles = eles.slice(low, high)
            newEles.addClass("query_check");
            return newEles;
        }
    }

    // reset the form part of the interface
    function clearInterface(){
        var form = document.getElementById('selector_form'),
            inputs;
        if ( form !== null ) {
            inputs = form.getElementsByTagName('input');
            for ( var i=0, len=inputs.length; i<len; i++ ) {
                inputs[i].value = '';
            }
        }
        document.getElementById('selector_parts').innerHTML = '';
        document.getElementById('selector_count').innerHTML = '';
        document.getElementById('selector_text').innerHTML = '';
        document.getElementById('collect_error').innerHTML = '';
        clearClass('query_check');
        clearClass('active_selector');
        clearClass('saved_preview');
    }

    /*
    given an html element, create .selector_group elements to represent 
    all of the elements in range (body, @ele]
    */
    function makeSelectorGroups(ele){
        var long_selector = '';
        clearClass('collect_highlight');
        if ( !ele ) {
            return;
        }
        // get option, not select
        if ( ele.tagName === "SELECT" ) {
            ele = ele.children[0];
        }
        long_selector = elementSelector(ele);
        document.getElementById('selector_parts').innerHTML = long_selector;
        updateInterface();
    }


    /*
    returns the html for a set of "group selectors" used to describe the ele 
    argument's css selector from one step above the body to the element each 
    group selector consists of a toggleable span for the element's tag, as well
    as id and any classes if they exist (and a delete button to get rid of that 
    group selector) a toggleable element can be turned on/off
    to test what is selected when it is/isn't included in the query selector
    if a parent element is passed, that is the last element that should be included in the selector
    (so it will stop when you reach that element's parent), otherwise stop when you reach the body
    */
    function elementSelector(ele, parent) {
        var ele_selector,
            selector = '',
            count = 0,
            first = true,
            stopParent =  parent ? parent.parentElement : document.body;
        // stop generating selector when you get to the body element
        if ( ele === null ) {
            alertMessage('no valid elements match selector in page');
            return '';
        }
        while ( ele !== null && ele !== stopParent ){
            if ( !testSelectorRules(ele) ) {
                ele = ele.parentElement;
                continue;
            }
            ele_selector = new Selector( ele );
            // default 'off' class for all parent elements
            if ( count++ > 0 ) {
                first = false;
            }
            selector = ele_selector.toHTML(first) + ' ' + selector;
            ele = ele.parentElement;
        }
        return selector;
    }

    /********************
        GROUPS
    ********************/

    /*
    create option elements for each of the groups for the current site
    */
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
                selectors += selectorHTML(group[key]);
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

    /*
    get the option element that is currently selected
    */
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

    /********************
        STORAGE
    ********************/

    function getRules(callback){
        chrome.storage.local.get('rules', callback);
    }

    /*
    create the group and add the rules
    currently overrides if there is an existing group with that name
    */
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
                        selectors += selectorHTML(rule);
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

    /********************
        SELECTOR OBJECT
    ********************/
    function Selector( ele ){
        this.tag = ele.tagName.toLowerCase();
        this.id = ele.hasAttribute('id') ? '#' + ele.getAttribute('id') : undefined;
        this.classes = [];
        for ( var i=0, len=ele.classList.length; i<len; i++ ) {
            var curr = ele.classList[i];
            if ( curr === "collect_highlight" || curr === "query_check" ) {
                continue;
            }
            this.classes.push( '.' + curr );
        }
        if ( $("#ignoreselectors").is(":checked") ) {
            this.removeCommon();
        }
    }

    Selector.prototype.removeCommon = function(){
        var classLength = this.classes.length;
        while ( classLength-- ){
            if ( collect.ignoreSelectors[this.classes[classLength]] === true ) {
                this.classes.splice(classLength, 1);
            }
        }
    }

    /*
    returns the html for a selector group
    if first, the toggleable element's won't have class .off
    */
    Selector.prototype.toHTML = function(first){
        var selector = wrapToggleableHTML(this.tag, first);
        if ( this.id ) {
            selector += wrapToggleableHTML(this.id, first);
        }
        if ( this.classes.length ) {
            for ( var pos=0, len=this.classes.length; pos < len; pos++ ) {
                selector += wrapToggleableHTML(this.classes[pos], first);
            }
        }

        return "<span class='selector_group no_select'>" + selector +
            "<span class='nthtype no_select' title='add the nth-of-type pseudo selector'>+t</span>" + 
            (first ? "" : "<span class='onlychild no_select' title='next selector must be direct child (&gt; in css)'>&gt;</span>") + 
            "<span class='deltog no_select'>x</span>"+
            "</span>";
    };

    /****************
    GENERAL HTML RETURNING FUNCTIONS
    ****************/

    function wrapToggleableHTML(to_wrap, on) {
        return "<span class='toggleable realselector no_select" + (on ? "":" off") + "'>" + to_wrap + "</span>";
    }

    function pseudoHTML(selector, val) {
        return "<span class='pseudo toggleable no_select'>:" + 
            selector + "(<span class='child_toggle no_select' title='options: an+b " + 
            "(a & b are integers), a positive integer (1,2,3...), odd, even'" + 
            "contenteditable='true'>" + (val || 1 ) + "</span>)</span>";
    }

    // add interactive identifier for saved selectors
    function selectorHTML(obj){
        obj = selectorIsComplete(obj);
        return '<span class="collect_group no_select">' + 
            '<span class="' + (obj.incomplete ? 'incomplete_selector' : 'saved_selector') +
            ' no_select" data-selector="' + obj.selector + 
            '" data-capture="' + obj.capture + '" data-index="' + obj.index + '"">' + obj.name + 
            '</span><span class="deltog no_select">x</span></span>';
    }

    /*
    given an element, return html for selector text with 
    "capture"able parts wrapped
    */
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
        ele.classList.remove('query_check', 'collect_highlight');
        if ( ele.hasAttribute('src') ) {
            var value = ele.getAttribute('src'),
                query = value.indexOf('?');
            if ( query !== -1 ) {
                value = value.slice(0, query);
            }
            ele.setAttribute('src', value);
        }
        if ( ele.textContent !== "" ) {
            innerText = ele.textContent.replace(/(\s{2,}|[\n\t]+)/g, ' ');
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

    /*
    wrap an attribute or the text of an html string 
    (used in #selector_text div)
    */
    function wrapTextHTML(text, type){
        // don't include empty properties
        if ( text.indexOf('=""') !== -1 ) {
            return '';
        }
        return '<span class="capture no_select" title="click to capture ' + type + 
            ' property" data-capture="' + type + '">' + text + '</span>';
    }

    // attach to window so that only one instance is active at a time
    window.collectMade = true;
}
