var tabsByWindow = {};

function debug(...args) {
  // console.log(...args);
}

browser.tabs.query({})
.then(tabs => {
  tabs.forEach(tab => {
    if (!tabsByWindow[tab.windowId]) {
      tabsByWindow[tab.windowId] = [];
    }
    tabsByWindow[tab.windowId][tab.index] = tab.id;
  })
})
.then(() => debug(tabsByWindow))
.catch(e => console.log(e));

browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  debug("onAttached", tabId, attachInfo);
  tabsByWindow[attachInfo.newWindowId].splice(attachInfo.newPosition, 0, tabId);
  debug(tabsByWindow);
});

browser.tabs.onCreated.addListener(tab => {
  debug("onCreated", tab);
  tabsByWindow[tab.windowId].splice(tab.index, 0, tab.id);
  debug(tabsByWindow);
});

browser.tabs.onDetached.addListener((tabId, detachInfo) => {
  debug("onDetached", tabId, detachInfo);
  tabsByWindow[detachInfo.oldWindowId].splice(detachInfo.oldPosition, 1);
  debug(tabsByWindow);
});

browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  debug("onMoved", tabId, moveInfo);
  tabsByWindow[moveInfo.windowId].splice(moveInfo.fromIndex, 1);
  tabsByWindow[moveInfo.windowId].splice(moveInfo.toIndex, 0, tabId);
  debug(tabsByWindow);
});

function findTab(tabId) {
  return Object.entries(tabsByWindow)
    .map(([windowId, tabs]) => ({windowId, index: tabs.indexOf(tabId)}))
    .find(({windowId, index}) => index != -1);
}

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  debug("onRemoved", tabId, removeInfo);
  if (!removeInfo.isWindowClosing) {
    var {windowId, index} = findTab(tabId);
    debug(windowId, index);
    tabsByWindow[windowId].splice(index, 1);
    browser.tabs.update(
      tabsByWindow[windowId][index == 0 ? 0 : index - 1],
      {active: true})
    .catch(e => console.log(e));
  } else {
    tabsByWindow[windowId].splice(index, 1);
  }
  debug(tabsByWindow);
});
