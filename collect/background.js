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