/*
CollectJS background page
*/

// inject collectjs interface when the browserAction icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(null, {file: "css/interface.css"});
    chrome.tabs.executeScript(null, {file: "jquery.js"}, function(){
        chrome.tabs.executeScript(null, {file: "collect.js"});    
    });
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if ( message ) {
        if ( message.type === "upload") {
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
        // not currently being called. timeout issue?
        callback(resp);
    }
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(data);
}
