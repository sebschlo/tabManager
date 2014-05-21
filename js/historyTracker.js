/* global chrome */
/*jslint browser: true, devel: true, sloppy: true */


// chrome.browserAction.onClicked.addListener(function(tab) {
//   chrome.tabs.create({url: chrome.extension.getURL('index.html')});
// });

chrome.tabs.onCreated.addListener(function (t) {
  //alert(); 
  //console.log("Creating tab: " + t.id + " (" + t.url + ")");

  var tabId = (t.id).toString();
  //var history = new Array();
  //history.push(t.url);

  var pair = {};
  pair[tabId] = t; // {tabId : t}
  console.log('set');
  console.log(t.url);
  chrome.storage.sync.set(pair);

  /*chrome.tabs.captureVisibleTab(null, null, function(img) {
    t["screenshot"] = img;
    //t["history"]		= history;
    var pair = {};
    pair[tabId] = t; // {tabId : t}

    chrome.storage.sync.set(pair, function() {});
  });*/
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, t) { 
  if (changeInfo.url === undefined) {
    console.debug('aborting');
    // Bail if not triggered by navigation
    return;
  } console.debug('successful');

  var pair = {};
  pair[tabId.toString()] = t;
  chrome.storage.sync.set(pair);

  /*chrome.tabs.captureVisibleTab(null, null, function(img) {
    t["screenshot"] = img;
    //chrome.storage.sync.get(tabId.toString(), function(tab){

    //tab[tabId]["history"].push(changeInfo.url);
    //tab[tabId]["screenshot"]=img;

    var pair = {};
    pair[tabId.toString()] = t; //tab[tabId];
    chrome.storage.sync.set(pair, function() {});
    console.log('Most U2D: ')
    console.log(t);
  });*/

});
