/*
CollectJS background page
*/

chrome.storage.local.get(null, function(storage) {
    if ( !storage.rules ) {
        chrome.storage.local.set({"rules": {}});
    }
   if ( !storage.groups ) {
        chrome.storage.local.set({"groups": {}});
    }    
});

// inject collectjs interface when the browserAction icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(null, {file: "css/interface.css"});
    chrome.tabs.executeScript(null, {file: "jquery.js"}, function(){
        chrome.tabs.executeScript(null, {file: "collect.js"});    
    });
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if ( message ) {
        switch ( message.type ) {
            case "upload":
                uploadData(message.msg, sendResponse);
                // return true so sendResponse does not become invalid
                // http://developer.chrome.com/extensions/runtime.html#event-onMessage
                return true;
            case "groups":
                getGroups(sendResponse);
                return true;
        }
    }
});

function uploadData(data, callback){
    // url is the endpoint that you're uploading the collect rules to
    var url = "http://localhost:5000/upload",
        xhr = new XMLHttpRequest();

    xhr.onload = function(event){
        var resp = JSON.parse(xhr.responseText);
        callback(resp);
    }
    xhr.onerror = function(event){
        callback({"error": true});
    }

    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}

function getGroups(callback){
    var url = "http://localhost:5000/groups",
        xhr = new XMLHttpRequest();

    xhr.onload = function(event){
        var resp = JSON.parse(xhr.responseText);
        console.log(resp);
        chrome.storage.local.get('groups', function(storage){
            var groups = storage.groups,
                newGroups = resp.groups,
                curr, currObject, currRules;
            for ( var i=0, len=newGroups.length; i<len; i++ ) {
                curr = newGroups[i];
                currRules = curr.rules;
                currObject = {};
                for ( var key in currRules ) {
                    currObject[key] = currRules[key];
                }
                groups[curr.name] = currObject;
            }
            
            chrome.storage.local.set({'groups': groups});
        });

        callback({"error": false, "groups": resp.groups});
    }
    xhr.onerror = function(event){
        callback({"error": true});
    }

    xhr.open("GET", url);
    xhr.send();   
}