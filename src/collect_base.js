// check to make sure an interface hasn't already been created
if ( !window.collectMade ) {
(function(){
"use strict";
var makeCollect = function($){
    /***************
    COLLECT OBJECT
    ***************/
    var Collect = {};

    Collect.setup = function(){
        this.elements = "body *:not(.no_select)";
        // default group if localStorage.rules is undefined
        if ( !localStorage.rules ) {
            localStorage.rules = "{\"default\":{}}";
        }
        addInterface();
        this.events.permanent();
        this.events.on(); 
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
                _this.swapClasses('con', 'pro');
                clearClass('query_check');
                clearClass('collect_highlight');
                clearClass('saved_preview');
            } else {
                Collect.events.on();
                _this.text('Turn Off');
                _this.swapClasses('pro', 'con');
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
            var elesToRemove = '#collect_interface, #options_interface, #collect-style,' +
                ' #options_background, #preview_interface, #preview_background';
            $(elesToRemove).remove();
        }

        // toggle interface between top and bottom of screen
        function moveInterface(event){
            event.stopPropagation();
            var collect_interface = $('#collect_interface');
            if ( collect_interface.hasClass('attach_top') ) {
                collect_interface.swapClasses('attach_top', 'attach_bottom');
                $(this).text('Move to Top');
            } else {
                collect_interface.swapClasses('attach_bottom', 'attach_top');
                $(this).text('Move to Bottom');
            }
        }

        // select which attribute (or text) to capture desired data from query selected elements
        function setCaptureVal(event){
            var _this = $(this);
            $('#selector_capture').val( _this.data('capture') );
        }


        function stopPropagation(event){
            event.stopPropagation();
        }

        function verifyDropdown(event){
            event.stopPropagation();
            // verify that nth-of-type is legitimate input
            var _this = $(this),
                text = _this.text().toLowerCase(),
                /* matches nth-of-type selectors:
                    odd, even, positive integers, an+b, -an+b
                */
                child_match = /^(?:odd|even|-?\d+n(?:\s*(?:\+|-)\s*\d+)?|\d+)$/;
            if ( text.match(child_match) === null ) {
                // if input is bad, reset to 1 and turn the selector off
                _this.text('1').parent().addClass('off');
            }
            updateInterface();
        }

        /*
        if there is a pseudo selector and all other parts of a seletor group are turned off,
        turn off the pseudo selector as well. If turning on a pseudo selector, turn on the first
        element of the group as well
        */
        function toggleOff(event){
            var _this = $(this),
                parent = this.parentElement,
                pseudo = parent.getElementsByClassName('pseudo'),
                pseudoElement = pseudo[0],
                $pseudo = $(pseudoElement),
                onlychild = parent.getElementsByClassName('child'),
                childElement = onlychild[0],
                $child = $(childElement),
                toggleables = parent.getElementsByClassName('realselector'),
                toggleableCount = toggleables.length,
                offCount = 0,
                turningOn = _this.hasClass('off');

            // toggle .off, then count classes that are off
            _this.toggleClass('off');
            for ( var r=0, len = toggleables.length; r<len; r++ ) {
                if ( toggleables[r].classList.contains('off')){
                    offCount++;
                }
            }

            if ( turningOn ) {
                // turning on the pseudo element, make sure something else if turned on
                if ( pseudoElement === this  && offCount === toggleableCount ) {
                    $(toggleables[0]).removeClass('off');
                } else if ( childElement === this && offCount === toggleableCount ) {
                    $(toggleables[0]).removeClass('off');
                }
            } else {             
                // if all "real" selectors are turned off, make sure to turn off the nth-of-type and
                // > selectors as well
                if ( toggleableCount === offCount ) {
                    if ( pseudoElement !== this && pseudoElement && !$pseudo.hasClass('off') ) {
                        $pseudo.addClass('off');
                    }
                    if ( childElement !== this && childElement && !$child.hasClass('off') ) {
                        $child.addClass('off');
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
            var inputs = $('#selector_form input'),
                selector_object = {},
                active = $('.active_selector').eq(0),
                missing = [],
                group = currentGroup();
                
            for ( var p=0, len=inputs.length; p<len; p++ ) {
                var curr = inputs[p],
                    name = curr.getAttribute('name') || 'noname',
                    value = curr.value;
                // hardcoded to allow index to be empty
                if ( value === '' && name != 'index' ) {
                    missing.push(name);
                } else {
                    selector_object[name] = value;
                }
            }
            if ( missing.length !== 0 ){
                $('#collect_error').html('missing attribute(s): ' + missing.join(', '));
                return;
            }
            // active isn't undefined if you're editing an already saved selector
            if ( active.length ){
                saveRule(group, selector_object);

                // modify name, selector, and capture but not index
                active
                    .data('selector', selector_object.selector)
                    .data('capture', selector_object.capture)
                    .data('index', selector_object.index)
                    .text(selector_object.name)
                    .removeClass('active_selector');
                // move to saved_selectors
                if ( active.parents('#desired_selectors').length ) {
                    active
                        .swapClasses('desired_selector', 'saved_selector')
                        .parents('.collect_group')
                        .appendTo('#saved_selectors');
                }
            } else {
                selector_object.index = saveRule(group, selector_object);
                // call last because index needs to be set
                addSavedSelector(selector_object);
            }
            clearInterface();
        }

        // output a preview of current selector form values to the preview modal
        function previewRule(event){
            event.preventDefault();
            var selector = $('#selector_string').val(),
                eles = selectorElements(selector),
                type = $('#selector_capture').val(),
                outString = '',
                i = 0,
                len = eles.length,
                attr;
            if ( selector === '' || type === '' ) {
                outString = "No attribute to capture";
            } else if ( type === 'text' ) {
                for ( ; i<len; i++ ) {
                    outString += "<p>" + ($(eles[i]).text()) + "</p>";
                }
            } else if ( type.indexOf('attr-') === 0 ) {
                // get everything after attr-
                attr = type.slice(type.indexOf('-')+1);
                for ( ; i<len; i++ ) {
                    outString += "<p>" + ($(eles[i]).prop(attr)) + "</p>";
                }
            }
            $("#preview_holder").html(outString);
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
                var verifyDelete = confirm("Confirm you want to delete group \"" + selector_name + "\"");
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
            var _this = $(this);
            if ( _this.hasClass('active_selector') ) {
                clearInterface();
            } else {
                loadSelectorGroup(this);
            }
        }
        
        // sets the fields in the #selector_form given an element 
        // that represents a selector
        function loadSelectorGroup(ele){
            var _this = $(ele),
                selector = decodeURIComponent(_this.data('selector').replace(/\+/g, ' ')),
                name = _this.text(),
                index = _this.data('index'),
                capture = _this.data('capture');
            $('#selector_name').val(name);
            $('#selector_string').val(selector);
            $('#selector_capture').val(capture);
            $('#selector_index').val(index);
            if ( selector !== '' ){
                var longHTML = elementSelector($(selector)[0]);
                $("#selector_parts").html(longHTML);

                clearClass("query_check");
                selectorElements(selector).addClass("query_check");
            }
            clearClass('active_selector');
            _this.addClass('active_selector');
        }

        function previewGroupEvent(event){
            event.preventDefault();
            clearInterface();
            var rules = getRules(currentGroup()),
                outString = '';
            $('#saved_selectors').html('');

            for( var key in rules ) {
                var curr, results, resultsLen, prop;
                curr = rules[key];
                addSavedSelector(curr);
                results = document.querySelectorAll(curr.selector);
                resultsLen = results.length;
                prop = captureFunction(curr);
                outString += "<div class='preview_group'><h2>" + curr.name + 
                    "(Count: " + resultsLen + ")</h2><ul>";
                for (var r=0; r<resultsLen; r++ ) {
                    var ele = results[r];
                    $(ele).addClass("saved_preview");
                    outString += "<li>" + prop(ele) + "</li>";
                }
                outString += "</ul></div>";
            }
            $('#preview_holder').html(outString);
            $("#preview_interface, #preview_background").show();
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
                $('#saved_selectors').html('');
                clearInterface();
            }
        }

        function deleteGroupEvent(event){
            event.preventDefault();
            var group = currentGroup();
            clearRules(group);
            // don't delete default group
            if ( group !== 'default' ) {
                $('#collect_selector_groups option:selected').remove();
            } else {
                alertMessage("Cannot delete 'default' group");
            }
            loadSavedSelectors();
        }

        function uploadGroupEvent(event){
            event.preventDefault();
            var group = currentGroup(),
                rules = getRules(group),
                uploadObject = {
                    host: location.host,
                    rules: rules,
                    name: group
                },
                uploadJSON = JSON.stringify(uploadObject);
            chrome.runtime.sendMessage({'type': 'upload', 'msg': uploadJSON}, function(response){
                console.log(response);
            });
        }

        function loadGroupEvent(event){
            loadSavedSelectors();
        }

        function select(event){
            event.stopPropagation();
            $(this).addClass('collect_highlight');
        }

        function deselect(event){
            event.stopPropagation();
            $(this).removeClass('collect_highlight');
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
            if ( !$('.active_selector').length ){
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
                $('#saved_selectors, #desired_selectors').on('click', '.deltog', deleteRuleEvent);
                $('#collect_preview_saved').on('click', previewGroupEvent);
                $('#collect_new_group').on('click', createGroupEvent);
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

                $('#saved_selectors').on('click', '.saved_selector', clearOrLoad);
                $('#desired_selectors').on('click', '.desired_selector', clearOrLoad);

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

                $('#saved_selectors').off('click', '.saved_selector', clearOrLoad);
                $('#desired_selectors').off('click', '.desired_selector', clearOrLoad);

                $(Collect.elements).off({
                    mouseenter: select,
                    mouseleave: deselect,
                    click: querySelector
                });
            }
        };
        return events;
    })();


    /********************
        AJAX functions
    ********************/
    Collect.load = function(json_url){
        $.ajax({
            type: "GET",
            dataType: "json",
            url: json_url,
            success: function(data){
                // loads a json object, array of desired properties to collect
                var selectors = "",
                    curr;
                if ( data.names) {
                    for ( var i=0, len=data.names.length; i < len; i++) {
                        curr = data.names[i];
                        selectors += '<span class="collect_group no_select">' + 
                            '<span class="desired_selector no_select' +
                            ' data-selector="' + (curr.selector || '') + '"' +
                            ' data-capture="' + (curr.capture || '') + '">' +
                            curr.name + '</span>' +
                            '<span class="deltog no_select">X</span></span>';
                    }
                    $('#desired_selectors').html(selectors);
                }
            }
        });
    };

    Collect.upload = function(json_url, uploadData){
        $.ajax({
            type: "POST",
            dataType: "json",
            data: JSON.stringify(uploadData),
            url: json_url,
            success: function(data){
                    
            },
            error: function(){

            }
        }); 
    };

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
        var interface_html = "{{src/collect.html}}";
        $(interface_html).appendTo('body');
        $('#collect_interface, #collect_interface *').addClass('no_select');

        addRuleGroups();    
        addOptions();
        addPreview();
    }

    // utility function because I was removing/adding classes in a number of places
    $.fn.swapClasses = function(oldClass, newClass){
        return this.each(function(){
            $(this)
                .removeClass(oldClass)
                .addClass(newClass);
        });
    };

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
    function addSavedSelector(obj){
        var selectorString = '<span class="collect_group no_select">' + 
            '<span class="saved_selector no_select" data-selector="' + obj.selector + 
            '" data-capture="' + obj.capture + '" data-index="' + obj.index + '"">' + obj.name + 
            '</span><span class="deltog no_select">x</span></span>';
        $('#saved_selectors').append(selectorString);
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


    // localstorage related functions

    /*********************
        group functions
    *********************/
    function addRuleGroups() {
        var rules = getRules(),
            groupSelect = document.getElementById('collect_selector_groups'),
            option,
            first = true;
        if ( JSON.stringify(rules) === JSON.stringify({})) {
            addGroup('default');
        } else {
            for ( var key in rules ) {
                option = newGroupOption(key, first);
                // set the first option to selected
                if ( first ) {
                    first = !first;
                }
                groupSelect.appendChild(option);
            }
        }
        loadSavedSelectors();
    }

    function loadSavedSelectors(){
        var group = currentGroup(),
            rules = getRules(group);
        $('#saved_selectors').html('');
        for( var key in rules ){
            addSavedSelector(rules[key]);
        }
    }


    function addGroup(groupName){
        // if no rules exist, create default group
        if ( localStorage.rules === undefined ) {
            localStorage.rules = "{\"default\":{}}";
        }
        var rules = JSON.parse(localStorage.rules);
        if ( rules[groupName] !== undefined ) {
            return false;
        } else {
            $('#collect_selector_groups option:selected').prop('selected', 'false');
            rules[groupName] = {};
            localStorage.rules = JSON.stringify(rules);
            var groupSelect = document.getElementById('collect_selector_groups'),
                newGroup = newGroupOption(groupName, true);
            groupSelect.appendChild(newGroup);
            return true;
        }
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

    function currentGroup(){
        var currGroup = $('#collect_selector_groups option:selected');
        if ( currGroup.length ) {
            return currGroup.eq(0).val();
        } else {
            // undecided on how to handle this yet
            return '';
        }
    }

    /*********************
        localStorage
    *********************/
    
    // saves @rule to localStorage.rules array
    function saveRule(group, rule){
        // should this break if group isn't passed?
        if ( arguments.length !== 2) {
            return false;
        }
        var rules = getRules(group),
            active = $('.active_selector');
        if ( active.length ) {
            var activeName = active.eq(0).text();
            if ( activeName !== rule.name ){
                delete rules[activeName];
            }
        }
        
        rules[rule.name] = rule;
        setRules(group, rules);
        return true;
    }

    // group argument optional, if not included return all rules
    function getRules(group){
        if ( localStorage.rules === undefined ) {
            localStorage.rules = "{}";
        }
        var rules = JSON.parse(localStorage.rules);
        if ( group === undefined ) {
            return rules;
        } else {
            // create group if it doesn't exist
            if ( rules[group] === undefined ) {
                rules[group] = {};
                localStorage.rules = JSON.stringify(rules);
            }
            return rules[group];    
        }
    }

    // only used by other localStorage calls
    function setRules(group, obj){
        var rules = getRules();
        rules[group] = obj;
        localStorage.rules = JSON.stringify(rules);
    }

    // delete @name rule from @group
    function deleteRule(group, name){
        if ( arguments.length !== 2) {
            return false;
        }
        var rules = getRules(group),
            returnVal = true;
        if ( rules[name] ) {
            $(rules[name].selector).removeClass('saved_preview');
            delete rules[name];
        } else {
            returnVal = false;
        }
        setRules(group, rules);
        return returnVal;
    }

    function clearRules(group){
        var currGroups = JSON.parse(localStorage.rules);
        // just clear contents of default, don't delete it
        if ( group === 'default' ) {
            currGroups[group] = {};
        } else {
            delete currGroups[group];    
        }        
        localStorage.rules = JSON.stringify(currGroups);
    }


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
            var index = $("#selector_index").val(),
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
            $('#collect_error').html('');
            if (selector === ''){
                $('#selector_count').html("0");
                $('#selector_string').val("");
                $('#selector_text').html("");
            } else {
                selected = selectorElements(selector);
                selected = addQueryCheck(selected);
                $('#selector_count').html(selected.length);
                $('#selector_string').val(selector);
                $('#selector_text').html(selectorText(selected[0]) || "no text");
            }
        };
    })();

    // purge a classname from all elements with it
    function clearClass(name){
        $('.'+name).removeClass(name);
    }

    // reset the form part of the interface
    function clearInterface(){
        $('#selector_form input').val('');
        $('#selector_parts, #selector_count, #selector_text').html('');
        $('#collect_error').html('');
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
            text_val = $(element).text().replace(singleSpaceRegexp, ' ').replace('&','&amp;'),
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
            /*
            make sure either start of phrase or a space before to prevent a bad match
            eg. title="test" would match data-title="test"
            */
            replace_regexp = new RegExp("(?:^|\\s)" + escapeRegExp(curr), 'g');
            // don't include on___ attrs
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
            $copy = $(copy),
            // strip unnecessary spaces spit out by some template englines
            text = $copy.text().replace(/(\s{2,}|[\n\t]+)/g,' ');
        $copy.removeClass('query_check').removeClass('collect_highlight');
        // 
        if ( text.length > 100 ){
            text = text.slice(0, 25) + "..." + text.slice(-25);
        }
        $copy.html(text);
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
        $('#selector_parts').html(long_selector);
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
        SELECTOR OBJECT
    ********************/
    function Selector( ele ){
        this.tag = ele.tagName;
        this.id = ele.hasAttribute('id') ? 
            '#' + ele.getAttribute('id') : undefined;
        this.classes = [];
        for ( var i=0, len=ele.classList.length; i<len; i++ ) {
            var curr = ele.classList[i];
            if ( curr === "collect_highlight" || curr === "query_check" ) {
                continue;
            }
            this.classes.push( '.' + curr );
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
})();
}