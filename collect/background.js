/*
CollectJS background page
*/

// inject collectjs interface when the browserAction icon is clicked
chrome.browserAction.onClicked.addListener(function(tab) {
    chrome.tabs.insertCSS(tab.id, {file: "css/interface.css"});
    console.log(tab.id);
    chrome.tabs.executeScript(tab.id, {file: "collect.js"});  
});