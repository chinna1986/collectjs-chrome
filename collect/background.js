/*
CollectJS background page
*/

chrome.storage.local.get(null, function(storage) {
    if ( !storage.sites ) {
        chrome.storage.local.set({"sites": {}});
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
                xhr("POST", "http://localhost:5000/upload", JSON.stringify(message.data), sendResponse, true);
                // return true so sendResponse does not become invalid
                // http://developer.chrome.com/extensions/runtime.html#event-onMessage
                return true;
        }
    }
});

// basic ajax request that returns data from server on success, otherwise object with error=true
function xhr(type, url, data, callback, json){
    // url is the endpoint that you're uploading the collect rules to
    var xhr = new XMLHttpRequest();

    xhr.onload = function(event){
        var resp = JSON.parse(xhr.responseText);
        callback(resp);
    }
    xhr.onerror = function(event){
        callback({"error": true});
    }

    if ( type === "GET" ) {
        xhr.open("GET", url + "?" + data);
        xhr.send();
    } else if ( type === "POST") {
        
        xhr.open("POST", url);
        if ( json ) {
            xhr.setRequestHeader("Content-Type", "application/json");
        }
        xhr.send(data);
    }
}
