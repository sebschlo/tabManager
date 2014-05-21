$(document).ready(function() {
  populateTabExpose();
  populateCategories();
  handleAddCategories();

  /* 
   * Button Functionality
   */

  // GRID/LIST VIEWS
  $('#grid-mode').click(function() {
    $('#grid-view').css('display', 'block');
    $('#list-view').css('display', 'none');
  });
  $('#list-mode').click(function() {
    $('#list-view').css('display', 'block');
    $('#grid-view').css('display', 'none');
  });

  // NEW WINDOW
  $('#new-window').click(function() {
    chrome.windows.create({});
  });


  // categories event handlers
  // NEED TO CHECK IF WE ALREADY HAVE A INPUT NEWLINE...
  $("#createCategory").click(function() {
    var path = "<input type='text' id='newCategory' placeholder='new category'/>";
    $("#tab-categories li:last-child").after(path);
    saveNewCategory();
  });

  $("#snoozeButton").click(function() {
    $("#snoozeModal").foundation('reveal', 'open');
  });

  // $("#snoozeExit").click(function() {
  //   $("#snoozeModal").foundation('reveal','close');
  // });

  // $("#nxtMonth").click(function(){
  //   clear();
  // });

});

/* ===================================================================
 *                          LISTS
 * ================================================================= */
 function populateCategories() {
  var currCategories = new Array();
  getCatList(function(cat){
    // i think this will only be the case if we saved cat...
    if(cat.categories) {
      console.debug(cat.categories);
      currCategories = cat.categories;
      for(var i=0; i < currCategories.length; i++) {
        addCategoryToPanel(currCategories[i]);
      }
    }
  });
}

function handleAddCategories() {
  $("#tab-categories li:last-child").click(function() {
    categoryName = $(this).attr('id'); 
    openCategoryTabs(categoryName);
    showGridView(categoryName);
  });
  $('#tab-categories li').click(function() {
    if ($(this).attr('id') === 'open') {
      populateTabExpose();
      $('#list-mode').removeClass('disabled');
    }
  })
}

function addCategoryToPanel(newCategory) {
  // var path = '<li id="' + newCategory + '" class="ui-droppable">' + newCategory + '</li>'; 
  var path = '<li id="' + newCategory + '" class="ui-droppable">';
  path += '<div class="tab-category inline">' + newCategory + '</div><div class="inline delete-category">&#215;</div></li>'; 
  $('#tab-categories li:last-child').after(path);
  $('#tab-categories').delegate('li', 'hover', function(){
    makeDroppable();
    removeCategoryfromPanel();
  });
  handleAddCategories();
}

function openCategoryTabs(categoryName) {
  var urls           = new Array();
  chrome.storage.sync.get(categoryName, function(category){
    console.debug(categoryName);
    console.debug(category);
    console.debug(category[categoryName]);

    var allTabs = category[categoryName];

    chrome.storage.sync.get(allTabs, function(tab) {
      var tabIndex;
      for(var i=0; i < allTabs.length; i++) {
        tabIndex = allTabs[i];
        urls.push(tab[tabIndex].url);
      }
      createTabNewWindow(urls);
    });
  });
}

function showGridView(categoryName) {
  chrome.storage.sync.get(categoryName, function(category) {
    var tabIds = category[categoryName];

    chrome.storage.sync.get(tabIds, function(tab) {
      var tabArray = new Array();
      for (var tabId in tab) {
        tabArray.push(tab[tabId]);
      }
      $('ul#grid-view').html(getGridHtml(tabArray));
      $('ul#grid-view').css('display', 'block');
      $('#list-mode').addClass('disabled');
      $('ul#list-view').css('display', 'none');
    })
  });
}

function removeCategoryfromPanel() {
  $(".delete-category").click(function() {
    var category = $(this).parent('li').attr('id');
    deleteCategory(category);
    $(this).parent('li').remove();
  });
}

function saveNewCategory() {
  var newCategory = $("#newCategory");
  newCategory.keypress(function(e) {
    // consider case where input value is empty
    if(e.which == 13) {
      var newCategoryName = newCategory.val();
      createCategory(newCategoryName);
      newCategory.remove();
      console.debug('adding new category to panel');
      addCategoryToPanel(newCategoryName);
    }
  });

}

/* ===================================================================
 *                       SCREENSHOT WINDOWS
 * ================================================================= */

/* APPLIES ALL THE FUNCTIONALITY TO THE LIST AND GRID WINDOWS AND
SHOWS THE APPROPRIATE SCREENSHOTS */

function screenshotApply() {
  // Go to clicked tab
  $(".screenshot-wrapper").click(function() {
    var tabId = parseInt($(this).attr('tabId'));
    var winId = parseInt($(this).attr('windowId'));
    chrome.tabs.update(tabId, {active: true});
    chrome.windows.update(winId, {focused: true});
  });

  // Close window button
  //TODO: Add an are you sure alert here
  $(".close-window").click(function() {
    var currWindow = $(this).parent().parent();
    var windowId = currWindow.attr('windowid');
    chrome.windows.remove(parseInt(windowId), function() {
      currWindow.parent().remove();
    }); 
  });

  // make tabs draggable
  $(".screenshot-wrapper").draggable({
    start: function(event, ui) {
      $(this).css('z-index', 100);
      $(this).css('opacity', 0.5);
    },
    stop: function(event, ui) {
      if (dropped==true) {
        // $(this).remove();
      } else {
        $(this).css('z-index', 0);
        $(this).css('opacity', 1);
      }
    },
    revert: "invalid",
    revertDuration: 200,
    scroll: false,
    appendTo: 'body'
  });

  // drop tabs to other windows
  $(".window").droppable({
    drop: function(event, ui) {
      var toWindow = $(this);
      var toWindowId = parseInt(toWindow.attr('windowId'));
      var draggable = $(ui.draggable);
      var tabId = parseInt(draggable.attr('tabId'));

      // update chrome
      // if dropped into the NEW WINDOW
      var currWindow = $(this);
      if(currWindow.attr('id') === 'new-window') {
        chrome.storage.sync.get(tabId.toString(), function(tab) {
          var thisTab = tab[tabId];
          console.log(thisTab);
          console.log(thisTab.url);
        });

        // Move tab
        chrome.windows.create({tabId: tabId, focused: false});

        // convert this "new window div" to a regular window div
        var newWindowHtml = currWindow.parent().html();
        prevNumber = currWindow.parent().prev().children('.window').attr('count');
        var newNumber = parseInt(prevNumber) + 1;
        currWindow.attr('count', newNumber);
        currWindow.children().children('.window-title').html("Window " + newNumber);
        currWindow.removeAttr('id', 'new-window'); // colors should update

        $(this).parent().parent().append('<li>'+newWindowHtml+'</li>');
        toWindow = $(this);

      } else {
        // if dropped into an existing window, simply move the tab
        chrome.tabs.move(tabId, {windowId: toWindowId, index: -1});
      }

      // update list view
      draggable.parent().remove();
      toWindow.children(".window-tabs").append('<li>'+draggable.html()+'</li>');

      populateTabExpose();
    }
  });

  // DROP TABS TO LISTS
  $(".tab-list li").droppable({
    drop: function(event, ui) {

      // add this tag to the list
      var category = $(this).attr('id');
      var draggable = $(ui.draggable);
      var tabId = draggable.attr('tabId');

      // If tab is dropped over snooze button, show modal
      if (category === 'snoozeButton') {
        $("#snoozeModal").foundation('reveal', 'open');
      }

      else if($(this).attr('class') === 'ui-droppable') {
        addTabToCategory(category, tabId);
      }

      else {
        console.debug($(this).attr('class'));
        console.debug("missed");
      }

      // Get rid of tab on expose
      draggable.parent().remove();

      // Actually close the tab on chrome
      chrome.tabs.remove(parseInt(tabId));
    }
  });

  $('.panel').mouseup(function() {
    currSelectedTab = $(this).attr('tabid');
    console.debug(currSelectedTab);
  });
}

/* ===================================================================
 *                        Tab Expose
 * ================================================================= */
 function populateTabExpose() {
  var openTabs = new Array();
  chrome.tabs.query({}, function(tabs) {
    $('ul#grid-view').css('display', 'none');
    $('ul#grid-view').html(getGridHtml(tabs));

    //var fullListHtml = getListHtml(groupByWindow(tabs));
    var windowDiv = $('ul#list-view').children().children('#new-window');
    var windowHtml = '<li>' + windowDiv.parent().html() + '</li>';
    $('ul#list-view').html(getListHtml(groupByWindow(tabs)) + windowHtml);
    $('ul#list-view').css('display', 'block');

    screenshotApply();
  });
}

function getListHtml(windows) {
  var count = 0;
  var html = "";
  for (var windowId in windows) {
    html += "<li><div class='window' windowId=" + windowId + " count='" + count + "'>";
    html += "<div class='window-header'><span class='window-title'>Window " + count + "</span>";
    html += "<span class='close-window'>&#215;</span></div>"
    html += "<ul class='window-tabs'>";
    var windowTabs = windows[windowId];
    for (var i = 0; i < windowTabs.length; i++) {
      html += getListHtmlForTab(windowTabs[i]);
    }
    html += '</ul>';
    count++;
  }
  return html;
}

function getListHtmlForTab(tab) {
/*  var tabId = tab.id.toString();
  chrome.storage.sync.get(tabId, function(tab2){
    console.log(tab);
   var isItDefined = tab2[tabId]["screenshot"];
   console.log(isItDefined);
    if (! isItDefined) {
      //alert(tabId + " butts " + tab[tabId]["title"]);
      var faviconUrl = tab2[tabId]["screenshot"];
    } else {
      var faviconUrl = getFaviconUrl(tab);
    //}
    var html = '<li class="list-tab"><div class="screenshot-wrapper inline" tabId='+tab.id+'><img class="faviconImage inline" src="'+faviconUrl+'"><div class="title inline">' + tab.title + '</div></div></li>';
    //if yes: faviconUrl = 
    return html;
  }); */
  var faviconUrl = getFaviconUrl(tab);
  var html = '<li><div class="screenshot-wrapper" tabId='+tab.id+' windowId='+tab.windowId+'><img class="faviconImage inline" src="'+faviconUrl+'"><div class="title inline truncate">' + tab.title.substring(0,30) + '</div></div></li>';
  return html;
}

function getGridHtml(tabs) {
  var html = "";
  for (var i = 0; i < tabs.length; i++) {
    html += getGridHtmlForTab(tabs[i]);
  }
  return html;
}

function getGridHtmlForTab(tab) {
  var faviconUrl = getFaviconUrl(tab);
  var html = '<li><div class="screenshot" style="background-image:url('+getScreenshotUrl(tab)+');"><div class="screenshot-wrapper truncate" tabId='+tab.id+' windowId='+tab.windowId+'><img class="faviconImage inline" src="'+faviconUrl+'">' + tab.title.substring(0,30) + '</div></div></li>';
  return html;
}

function getFaviconUrl(tab) {
  if (tab.favIconUrl) {
    // favicon appears to be a normal url
    return tab.favIconUrl;
  }
  else {
    // couldn't obtain favicon as a normal url, try chrome://favicon/url
    return 'chrome://favicon/' + tab.url;
  }
}

function getScreenshotUrl(tab) {
  return;// 'http://api.snapito.com/free/mc/' + parseUri(tab.url).host;
}

function groupByWindow(tabs) {
  var windows = {}; // dictionary from windowId to array of tabs
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    var windowId = tab.windowId;
    if (!windows[windowId]) {
      windows[windowId] = new Array();
    }
    windows[windowId].push(tab);
  }

  return windows;
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License

function parseUri (str) {
  var o   = parseUri.options,
    m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
    uri = {},
    i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};

parseUri.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};