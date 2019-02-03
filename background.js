// On startup, set each tab’s successor to its preceding tab.
browser.tabs.query({})
.then(tabs => {
  var tabsByWindow = {}; // type: {[WindowID]: {[TabIndex]: Tab}}
  tabs.forEach(tab => {
    if (!tabsByWindow[tab.windowId]) {
      tabsByWindow[tab.windowId] = [];
    }
    tabsByWindow[tab.windowId][tab.index] = tab.id;
  });
  Object.entries(tabsByWindow).forEach(([windowId, windowTabIds]) => {
    var reversedTabIds = windowTabIds.slice();
    reversedTabIds.reverse();
    browser.tabs.moveInSuccession(reversedTabIds);
  })
})
.catch(console.log);


function adjustSuccessor(windowId, tabIndex, tabId) {
  browser.tabs.query({windowId: windowId, index: (tabIndex > 0 ? tabIndex - 1 : 1)})
  .then(([referenceTab]) => {
    browser.tabs.moveInSuccession([tabId], referenceTab.id,
                                  {insert: tabIndex > 0, append: tabIndex <= 0});
  })
  .catch(console.log);
}


browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  adjustSuccessor(attachInfo.newWindowId, attachInfo.newPosition, tabId);
})

browser.tabs.onCreated.addListener(tab => {
  adjustSuccessor(tab.windowId, tab.index, tab.id);
});

browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  adjustSuccessor(moveInfo.windowId, moveInfo.toIndex, tabId);
});
