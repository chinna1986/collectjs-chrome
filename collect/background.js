/*
CollectJS background page
*/

chrome.storage.local.get(null, function(storage) {
    if ( !storage.rules ) {
        chrome.storage.local.set({"rules": {}});
    }
});

// inject collectjs interface when the browserAction icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(null, {file: "css/interface.css"});
    chrome.tabs.executeScript(null, {file: "selector.js"}, function(){
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

