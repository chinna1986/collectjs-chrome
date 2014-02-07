// check to make sure an interface hasn't already been created
if ( !window.collectMade ) {

"use strict";
var makeCollect = function($){
    /***************
    COLLECT OBJECT
    ***************/
    var Collect = {};

    Collect.setup = function(){
        this.elements = "body *:not(.no_select)";
        addInterface();
        this.events.permanent();
        this.events.on(); 
        this.ignoreSelectors = {'.clearfix':true};
    };

    Collect.events = (function(){
        /*************
        Event Functions
        *************/

        /*************
        Control Button Functions
        *************/
        var events_on = true;
        // turn off events for highlighting/selecting page elements
        function toggleEvents(event){
            event.stopPropagation();
            var _this = $(this);
            if ( events_on ) {
                Collect.events.off();
                _this.text('Turn On');
                swapClasses(this, 'con', 'pro');
                clearClass('query_check');
                clearClass('collect_highlight');
                clearClass('saved_preview');
            } else {
                Collect.events.on();
                _this.text('Turn Off');
                swapClasses(this, 'pro', 'con');
            }
            events_on = !events_on;
        }

        // close the collect interface
        function closeInterface(event){
            event.stopPropagation();
            Collect.events.off();
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
            if ( collect_interface.classList.contains('attach_top') ) {
                swapClasses(collect_interface, 'attach_top', 'attach_bottom');
                this.textContent = 'Move to Top';
            } else {
                swapClasses(collect_interface, 'attach_bottom', 'attach_top');
                this.textContent = 'Move to Bottom';
            }
        }

        // select which attribute (or text) to capture desired data from query selected elements
        function setCaptureVal(event){
            document.getElementById('selector_capture').value = this.dataset.capture;
        }


        function stopPropagation(event){
            event.stopPropagation();
        }

        function verifyDropdown(event){
            event.stopPropagation();
            // verify that nth-of-type is legitimate input
            var text = this.textContent.toLowerCase(),
                /* matches nth-of-type selectors:
                    odd, even, positive integers, an+b, -an+b
                */
                child_match = /^(?:odd|even|-?\d+n(?:\s*(?:\+|-)\s*\d+)?|\d+)$/;
            if ( text.match(child_match) === null ) {
                // if input is bad, reset to 1 and turn the selector off
                this.textContent = 1;
                this.parentElement.classList.add('off');
            }
            updateInterface();
        }

        /*
        if there is a pseudo selector and all other parts of a seletor group are turned off,
        turn off the pseudo selector as well. If turning on a pseudo selector, turn on the first
        element of the group as well
        */
        function toggleOff(event){
            var parent = this.parentElement,
                pseudoElement = parent.getElementsByClassName('pseudo')[0],
                childElement = parent.getElementsByClassName('child')[0],
                toggleables = parent.getElementsByClassName('realselector'),
                toggleableCount = toggleables.length,
                offCount = 0;

            // toggle .off, then count classes that are off
            this.classList.toggle('off');
            for ( var r=0, len = toggleables.length; r<len; r++ ) {
                if ( toggleables[r].classList.contains('off')){
                    offCount++;
                }
            }

            if ( this.classList.contains('off') ) {
                // when turning on the pseudo element or > selector, make sure something else is 
                // also turned on
                if ( pseudoElement === this  && offCount === toggleableCount ) {
                    toggleables[0].classList.remove('off');
                } else if ( childElement === this && offCount === toggleableCount ) {
                    toggleables[0].classList.remove('off');
                }
            } else {             
                // if all "real" selectors are turned off, make sure to turn off the nth-of-type and
                // > selectors as well
                if ( toggleableCount === offCount ) {
                    if ( pseudoElement !== this && pseudoElement && !$pseudo.hasClass('off') ) {
                        pseudoElement.classList.add('off');
                    }
                    if ( childElement !== this && childElement && !$child.hasClass('off') ) {
                        childElement.classList.add('off');
                    }
                }

                
            }
            
            updateInterface();
        }

        function blurUpdate(event){
            event.preventDefault();
            updateInterface();
        }

        function previewSelectorHover(event){
            var index = 0,
                elem = this,
                selector;
            while ( (elem=elem.previousElementSibling) !== null ) {
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
            $(this).parents('.selector_group').remove();
            updateInterface();
        }

        function addPseudoType(event){
            addPseudoElement('nth-of-type', this);
            this.parentElement.removeChild(this);
        }

        function addOnlyChildren(event){
            addOnlyChildElement(this);
            this.parentElement.removeChild(this);
        }

        // create and save an object for the current query selector/capture data
        function saveRuleEvent(event){
            event.preventDefault();
            var inputs = document.getElementById('selector_form').getElementsByTagName('input'),
                selector_object = {},
                activeSelectors = document.getElementsByClassName('active_selector'),
                active = activeSelectors[0],
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

                selector_object = completeSelector(selector_object);
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
                i = 0,
                len = eles.length,
                attr;
            if ( selector === '' || type === '' ) {
                outString = "No attribute to capture";
            } else if ( type === 'text' ) {
                for ( ; i<len; i++ ) {
                    outString += "<p>" + (eles[i].textContent) + "</p>";
                }
            } else if ( type.indexOf('attr-') === 0 ) {
                // get everything after attr-
                attr = type.slice(type.indexOf('-')+1);
                for ( ; i<len; i++ ) {
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
            var selector_span = this.previousElementSibling,
                selector_name = selector_span.innerHTML;
            if ( $("#safedelete").is(":checked") ) {
                var verifyDelete = confirm("Confirm you want to delete rule \"" + selector_name + "\"");
                if ( !verifyDelete ) {
                    return;
                }
            }
            
            $(this).parents('.collect_group').remove();
            deleteRule(currentGroup(), selector_name);
        }

        // load saved selector information into the #selector_form for editing
        function clearOrLoad(event){
            event.stopPropagation();
            if ( this.classList.contains('active_selector') ) {
                clearInterface();
            } else {
                loadSelectorGroup(this);
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
                var longHTML = elementSelector(document.querySelector(selector));
                document.getElementById('selector_parts').innerHTML = longHTML;

                clearClass("query_check");
                selectorElements(selector).addClass("query_check");
            }
            clearClass('active_selector');
            ele.classList.add('active_selector');
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
                    curr = completeSelector(curr);
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
                    return ele.innerText;
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
            if ( name !== '' && name !== null ){
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
                alertMessage("Cannot delete 'default' group");
                loadSavedSelectors();
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
            elementInterface(this);
        }

        /*************
        Event Bindings
        *************/

        var events = {
            permanent: function(){
                // #control_buttons
                $('#off_button').on('click', toggleEvents);
                $('#close_selector').on('click', closeInterface);
                $('#move_position').on('click', moveInterface);

                // rules for #form_buttons
                $('#collect_save').on('click', saveRuleEvent);
                $('#collect_clear_form').on('click', clearRuleForm);
                $('#collect_preview').on('click', previewRule);

                // group events
                $('#collect_selectors').on('click', '.deltog', deleteRuleEvent);
                $('#collect_preview_saved').on('click', previewGroupEvent);
                $('#collect_new_group').on('click', createGroupEvent);
                $('#collect_get_groups').on('click', getGroupsEvent);
                $('#collect_delete_group').on('click', deleteGroupEvent);
                $('#collect_upload_group').on('click', uploadGroupEvent);
                $('#collect_selector_groups').on('change', loadGroupEvent);
            },
            on: function(){
                $('#selector_text').on('click', '.capture', setCaptureVal);
                $('#selector_parts')
                    .on('click', '.child_toggle', stopPropagation)
                    .on('blur', '.child_toggle', verifyDropdown)
                    .on('click', '.toggleable', toggleOff)
                    .on('mouseenter', '.selector_group', previewSelectorHover)
                    .on('mouseleave', '.selector_group', removeSelectorHover)
                    .on('click', '.deltog', removeSelectorGroup)
                    .on('click', '.nthtype', addPseudoType)
                    .on('click', '.onlychild', addOnlyChildren);

                $('#selector_index').on('blur', blurUpdate);

                $('#collect_selectors').on('click', '.saved_selector, .incomplete_selector', clearOrLoad);

                $(Collect.elements).on({
                    mouseenter: select,
                    mouseleave: deselect,
                    click: querySelector
                });
            },
            off: function(){
                $('#selector_text').off('click', '.capture', setCaptureVal);
                $('#selector_parts')
                    .off('click', '.child_toggle', stopPropagation)
                    .off('blur', '.child_toggle', verifyDropdown)
                    .off('click', '.toggleable', toggleOff)
                    .off('mouseenter', '.selector_group', previewSelectorHover)
                    .off('mouseleave', '.selector_group', removeSelectorHover)
                    .off('click', '.deltog', removeSelectorGroup)
                    .off('click', '.nthtype', addPseudoType)
                    .off('click', '.onlychild', addOnlyChildren);

                $('#selector_index').off('blur', blurUpdate);

                $('#collect_selectors').off('click', '.saved_selector, .incomplete_selector', clearOrLoad);

                $(Collect.elements).off({
                    mouseenter: select,
                    mouseleave: deselect,
                    click: querySelector
                });
            }
        };
        return events;
    })();

    /***************
    END COLLECT OBJECT
    ***************/

    /********************
    PRIVATE FUNCTIONS
    ********************/
    
    /*
    create the collect interface, add no_select class to its elements so the interface
    doesn't interfere with itself, and add event listeners to the interface
    */
    function addInterface() {
        var interface_html = "{{src/collect.html}}",
            interfaceEles;
        document.body.innerHTML += interface_html;
        document.getElementById('collect_interface').classList.add('no_select');
        interfaceEles = document.querySelectorAll('#collect_interface *');
        for ( var i=0, len=interfaceEles.length; i<len; i++ ) {
            interfaceEles[i].classList.add('no_select');
        }
        loadGroups();
        addOptions();
        addPreview();
    }

    // utility function because I was removing/adding classes in a number of places
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
    options modal and selection options
    */
    function addOptions(){
        var options_html = "{{src/options.html}}",
            options_element = $(options_html);
        options_element.appendTo('body');
        $('#options_background, #options_interface, #options_interface *').addClass('no_select');
        $("#open_options, #close_options, #options_background").click(function(event){
            event.preventDefault();
            event.stopPropagation();
            options_element.toggle();
        });

    }

    /*
    adds the preview modal html and events to the page
    */
    function addPreview(){
        var preview_html = "{{src/preview.html}}",
            preview_element = $(preview_html);
        preview_element.appendTo('body');
        $('#preview_background, #preview_interface, #preview_interface *').addClass('no_select');
        $("#close_preview, #preview_background").click(function(event){
            event.preventDefault();
            event.stopPropagation();
            preview_element.toggle();
            clearClass('saved_preview');
        });
    }

    //addInterface helpers

    // add interactive identifier for saved selectors
    function selectorHTML(obj){
        obj = completeSelector(obj);
        return '<span class="collect_group no_select">' + 
            '<span class="' + (obj.incomplete ? 'incomplete_selector' : 'saved_selector') +
            ' no_select" data-selector="' + obj.selector + 
            '" data-capture="' + obj.capture + '" data-index="' + obj.index + '"">' + obj.name + 
            '</span><span class="deltog no_select">x</span></span>';
    }

    function completeSelector(selector_object){
        if ( selector_object.name === '' || selector_object.selector === ''
            || selector_object.capture === '' ) {
            selector_object.incomplete = true;
        }
        return selector_object;
    }    

    function addPseudoElement(pseudoSelector, ele){
        var _this = $(ele),
            parent = _this.parents('.selector_group'),
            html = pseudoHTML(pseudoSelector);
        parent.children('.pseudo').remove();
        parent.children('.toggleable').last().after($(html));
        // make sure the element is on so this selector makes sense
        parent.children('.toggleable').eq(0).removeClass('off');
        updateInterface();
    }

    function pseudoHTML(selector, val) {
        return "<span class='pseudo toggleable no_select'>:" + 
            selector + "(<span class='child_toggle no_select' title='options: an+b " + 
            "(a & b are integers), a positive integer (1,2,3...), odd, even'" + 
            "contenteditable='true'>" + (val || 1 ) + "</span>)</span>";
    }

    function addOnlyChildElement(ele){
        var _this = $(ele),
            parent = _this.parents('.selector_group'),
            html = "<span class='child toggleable no_select'> &gt;</span>";
        parent.children('.toggleable').last().after($(html));
        // make sure the element is on so this selector makes sense
        parent.children('.toggleable').eq(0).removeClass('off');
        updateInterface();   
    }

    // end addInterface helpers

    /*********************
        selectors/rules
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
        var groups = $('#selector_parts .selector_group'),
            selector = '',
            group_selector = '',
            togChildren,
            len = index || groups.length,
            group_text = [];
        for (var g=0; g < len; g++) {
            group_selector = '';
            togChildren = groups.eq(g).children('.toggleable');
            for ( var i=0, childrenLen=togChildren.length; i<childrenLen; i++ ) {
                var curr = togChildren.eq(i);
                // if index is undefined and element has class .off, use add empty string,
                // but when index is defined, we want all elements included
                group_selector += (curr.hasClass('off') && index===undefined) ? '' : curr.text();
            }
            if ( group_selector !== '' ) {
                group_text.push(group_selector);
            }
        }
        selector = group_text.join(' ');
        return selector;
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
    updates the interface based on the states of the (.selector_group)s
    */  
    var updateInterface = (function(){
        /*
        uses #seletor_index to exclude values from getting query_check
        positive values remove elements from beginning of the eles array
        negative values remove elements from the end of the eles array
        */
        function addQueryCheck(eles){
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

        return function(){
            var selector = baseSelector(),
                selected;
            clearClass('query_check');
            clearClass('collect_highlight');
            document.getElementById('collect_error').innerHTML = '';
            if (selector === ''){
                document.getElementById('selector_count').innerHTML = '0';
                document.getElementById('selector_string').value = '';
                document.getElementById('selector_text').innerHTML = '';
            } else {
                selected = selectorElements(selector);
                selected = addQueryCheck(selected);
                document.getElementById('selector_count').innerHTML = selected.length;
                document.getElementById('selector_string').value = selector;
                document.getElementById('selector_text').innerHTML = selectorText(selected[0]) || "no text";
            }
        };
    })();

    // purge a classname from all elements with it
    function clearClass(name){
        var eles = document.getElementsByClassName(name),
            len = eles.length;
        // iterate from length to 0 because its a NodeList
        while ( len-- ){
            eles[len].classList.remove(name);
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
    given an element, return html for selector text with 
    "capture"able parts wrapped
    */
    function selectorText(element) {
        var curr, attr, replace_regexp,
            // match 2+ spaces, newlines, and tabs
            singleSpaceRegexp = /(\s{2,}|[\n\t]+)/g,
            html = cleanOuterHTML(element).replace(singleSpaceRegexp, ' '),
            // match all opening html tags along with their attributes
            tags = html.match(/<[^\/].+?>/g),
            text_val = element.textContent.replace(singleSpaceRegexp, ' ').replace('&','&amp;'),
            attrs = tagAttributes(tags);               

        html = html.replace(/</g,'&lt;').replace(/>/g,'&gt;');
        html = wrapAttributes(html, attrs);
        // create capture spans with 'text' targets on all text
        if ( text_val !== '' ) {
            // concatenate long text with an ellipsis
            if ( text_val.length > 100 ){
                text_val = text_val.slice(0, 25) + "..." + text_val.slice(-25);
            }
            // strip preceding/trailing spaces
            text_val = text_val.replace(/</g,'&lt;').replace(/>/g,'&gt;');
            text_val = text_val.replace(/(^\s*|[\n\t]+|\s*$)/g, '');
            var regexp_string = '(?:&gt;\\s*)' + escapeRegExp(text_val) + '(?:\\s*&lt;)',
                text_replace_regexp = new RegExp(regexp_string, 'g'),
                replace_string = wrapText(text_val, 'text', '&gt;', '&lt;');
            html = html.replace(text_replace_regexp, replace_string);
        }
        return html;
    }

    /*
    @tags is an array of strings of opening html tags
    eg. <a href="#">
    returns an array of the unique attributes
    */
    function tagAttributes(tags){
        var attr_regex = /[a-zA-Z\-_]+=('.*?'|".*?")/g,
            attr_check = {},
            attrs = [],
            curr, tagAttrs;
        if ( tags ) {
            tagAttrs = tags.join('').match(attr_regex);
            if ( tagAttrs ) {
                // add unique attributes to attrs array
                for ( var p=0, tagLen=tagAttrs.length; p<tagLen; p++ ) {
                    curr = tagAttrs[p];
                    if ( !attr_check[curr] ) { 
                        attrs.push(tagAttrs[p]);
                        attr_check[curr] = true;
                    }
                }
            }
        }
            
        return attrs;
    }

    /*
    given an @html string and an array @attrs, iterate over items in attrs, and replace matched text
    in html with a wrapped version of that match
    */
    function wrapAttributes(html, attrs) {
        var curr,
            replace_regexp,
            attr;
        // replace attrs with capture spans
        for ( var i=0, prop_len=attrs.length; i<prop_len; i++ ) {
            curr = attrs[i];
            attr = curr.slice(0, curr.indexOf('='));
            // make sure either start of phrase or a space before to prevent a bad match
            // eg. title="test" would match data-title="test"
            replace_regexp = new RegExp("(?:^|\\s)" + escapeRegExp(curr), 'g');
            // don't include on___ attrs eg onmousemove
            if ( attr.indexOf('on') === 0 ) {
                html = html.replace(replace_regexp, '');    
            } else {
                // add the preceding space matched by replace_regexp to the replacement string
                html = html.replace(replace_regexp, " " + wrapText(curr, 'attr-' + attr));    
            }
        }
        return html;
    }

    // selectorText helpers

    /*
    returns a string representing the html for the @ele element
    and its text. Child elements of @ele will have their tags stripped, 
    returning only their text. 
    If that text is > 100 characters, concatenates for ease of reading
    */
    function cleanOuterHTML(ele){
        if (!ele) {
            return '';
        }
        var copy = ele.cloneNode(true),
            // strip unnecessary spaces spit out by some template englines
            text = copy.textContent.replace(/(\s{2,}|[\n\t]+)/g,' ');
        copy.classList.remove('query_check', 'collect_highlight');
        if ( text.length > 100 ){
            text = text.slice(0, 25) + "..." + text.slice(-25);
        }
        copy.innerHTML = text
        return copy.outerHTML;
    }

    /*
    wrap an attribute or the text of an html string 
    (used in #selector_text div)
    */
    function wrapText(ele, val, before, after){
        // don't include empty properties
        if ( ele.indexOf('=""') !== -1 ) {
            return '';
        }
        return (before || '') + '<span class="capture no_select" ' + 
            'title="click to capture ' + val + ' property" data-capture="' +
            val + '">' + ele + '</span>' + (after || '');
    }

    // escape a string for a new RegExp call
    function escapeRegExp(str) {
        return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    // end selectorText helpers

    /*
    given an html element, create .selector_group elements to represent 
    all of the elements in range (body, @ele]
    */
    function elementInterface(ele){
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
    group selector conssists of a toggleable span for the element's tag, as well
    as id and any classes if they exist (and a delete button to get rid of that 
    group selector) a toggleable element can be turned on/off
    to test what is selected when it is/isn't included in the query selector
    */
    function elementSelector(ele) {
        var ele_selector,
            selector = '',
            count = 0,
            toggle_on = true;
        // stop generating selector when you get to the body element
        while ( ele.tagName !== "BODY" ){
            if ( !testSelectorRules(ele) ) {
                ele = ele.parentElement;
                continue;
            }
            ele_selector = new Selector( ele );
            // default 'off' class for all parent elements
            if ( count++ > 0 ) {
                toggle_on = false;
            }
            selector = ele_selector.toHTML( toggle_on ) + ' ' + selector;
            ele = ele.parentElement;
        }
        return selector;
    }

    /********************
    END PRIVATE FUNCTIONS
    ********************/

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
        var currGroup = $('#collect_selector_groups option:selected');
        return (currGroup.length) ? currGroup.eq(0).val() : '';
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
                    rule = emptyRule(currRules[r]);
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

    function emptyRule(name){
        return {
            'name': name,
            'capture': '',
            'selector': '',
            'index': ''
        }
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
        this.tag = ele.tagName;
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
            if ( Collect.ignoreSelectors[this.classes[classLength]] === true ) {
                this.classes.splice(classLength, 1);
            }
        }
    }

    /*
    returns the html for a selector group
    */
    Selector.prototype.toHTML = function( on ){
        var selector = wrapToggleable(this.tag.toLowerCase(), on);
        if ( this.id ) {
            selector += wrapToggleable(this.id, on);
        }
        if ( this.classes.length ) {
            for ( var pos=0, len=this.classes.length; pos < len; pos++ ) {
                selector += wrapToggleable(this.classes[pos], on);
            }
        }

        return "<span class='selector_group no_select'>" + selector +
            "<span class='nthtype no_select' title='add the nth-of-type pseudo selector'>+t</span>" + 
            "<span class='onlychild no_select' title='next selector must be direct child (&gt; in css)'>&gt;</span>" + 
            "<span class='deltog no_select'>x</span>"+
            "</span>";
    };

    function wrapToggleable(to_wrap, on) {
        return "<span class='toggleable realselector no_select " + (on ? "":"off") + "'>" + to_wrap + "</span>";
    }

    /********************
    END SELECTOR OBJECT
    ********************/
    return Collect; 
};

var collect = makeCollect(jQuery);
collect.setup();

// attach to window so that only one instance is active at a time
window.collectMade = true;

}
