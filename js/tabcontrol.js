// FOUNDATION
$(document).foundation();






/* ===================================================================
 *                          GLOBAL VARIABLES
 * ===================================================================
 */

var openTabs = new Array();
var categories = new Array();
var currSelectedTab;

/* ===================================================================
 *                          TABS CONTROL
 * =================================================================== */

function createTab(url) {
  chrome.tabs.create({'url': url});
}

function createTabNewWindow(urls) {
  chrome.windows.create({'url': urls})
}

function clear() {
  chrome.storage.sync.clear();
}

/* ===================================================================
 *                        CATEGORIES CONTROL
 * =================================================================== */

/*
 * categories will always be stored in chrome.storage with key of 'categories'
 * WILL BE DEPRECATED SOON
 */
function createCategory(newCategory) {
  var categories = new Array();
  chrome.storage.sync.get('categories', function(cat){
    if(!_.isEmpty(cat)) {
      console.debug(cat.categories);
      categories = cat.categories;
    }
    categories.push(newCategory);
    chrome.storage.sync.set({'categories': categories}, function(){});
  });
  // console.debug('added category. category array is now: ' + categories);
}

function getCatList(callback) {
  chrome.storage.sync.get('categories', function(cat){
    callback(cat);
  });
}

function addTabToCategory(category, tabId, url) {
  chrome.storage.sync.get(category, function(curr){ // category is specific...
    // category is empty, no tabs have been placed in it yet - initialize array
    console.debug(curr);
    if(_.isEmpty(curr)) {
      console.debug('first entry');
      curr = new Array();
    }
    else {
      console.debug('not first entry');
      console.debug('currently: ')
      console.debug(curr);
      curr = curr[category];
    }
    curr.push(url);

    pair = {};
    pair[category] = curr;

    console.debug('pair is: ' + pair);
    // console.debug("tabId added: " + tabId)
    // console.debug("now category: " + category + " | is: " + curr);
    chrome.storage.sync.set(pair, function(){});
  });
}


function deleteCategory(category) {
  chrome.storage.sync.get(category, function(curr) {
    console.debug("before delete, curr is: ");
    console.debug(curr);

    chrome.storage.sync.remove(category);

    // test to see if we have removed:
    chrome.storage.sync.get(category, function(curr) {
      console.debug("after delete, curr is: ");
      console.debug(curr);
    });
  });

  // remove current category from 'all categories' list
  chrome.storage.sync.get('categories', function(categories) {
    var i = categories.categories.indexOf(category);
    if (i != -1) {
      categories.categories.splice(i, 1);
      chrome.storage.sync.set({'categories' : categories.categories });
    }
    else {
      console.debug("BIG ERROR.");
    }
  });
}
