var tabsByWindow = {};
var activeTabByWindow = {};

function debug(...args) {
  // console.log(...args);
}

browser.tabs.query({})
.then(tabs => {
  tabs.forEach(tab => {
    if (!tabsByWindow[tab.windowId]) {
      tabsByWindow[tab.windowId] = [];
    }
    tabsByWindow[tab.windowId][tab.index] = {id: tab.id, title: tab.title};
    if (tab.active) {
      activeTabByWindow[tab.windowId] = {id: tab.id, title: tab.title};
    }
  })
})
.then(() => debug(tabsByWindow, activeTabByWindow))
.catch(e => console.log(e));

browser.tabs.onAttached.addListener((tabId, attachInfo) => {
  debug("onAttached", tabId, attachInfo);
  browser.tabs.get(tabId).then(tab =>
    tabsByWindow[attachInfo.newWindowId]
    .splice(attachInfo.newPosition, 0, {id: tabId, title: tab.title}));
  debug(tabsByWindow);
});

browser.tabs.onCreated.addListener(tab => {
  debug("onCreated", tab);
  tabsByWindow[tab.windowId].splice(tab.index, 0, {id: tab.id, title: tab.title});
  debug(tabsByWindow);
});

browser.tabs.onDetached.addListener((tabId, detachInfo) => {
  debug("onDetached", tabId, detachInfo);
  tabsByWindow[detachInfo.oldWindowId].splice(detachInfo.oldPosition, 1);
  debug(tabsByWindow);
});

browser.tabs.onMoved.addListener((tabId, moveInfo) => {
  debug("onMoved", tabId, moveInfo);
  let tab = tabsByWindow[moveInfo.windowId][moveInfo.fromIndex];
  tabsByWindow[moveInfo.windowId].splice(moveInfo.fromIndex, 1);
  tabsByWindow[moveInfo.windowId].splice(moveInfo.toIndex, 0, tab);
  debug(tabsByWindow);
});

browser.tabs.onActivated.addListener(({tabId, windowId}) => {
  debug("onActivated", tabId, windowId);
  browser.tabs.get(tabId).then(tab =>
    activeTabByWindow[windowId] = {id: tabId, title: tab.title});
  debug(activeTabByWindow);
});

function findTab(windowId, tabId) {
  return (tabsByWindow[windowId] || []).findIndex(e => e.id == tabId);
}

browser.tabs.onRemoved.addListener((tabId, removeInfo) => {
  debug("onRemoved", tabId, removeInfo);
  let windowId = removeInfo.windowId;
  let index = findTab(windowId, tabId);
  if (!removeInfo.isWindowClosing
      && tabId == activeTabByWindow[windowId].id) {
    debug(windowId, index);
    tabsByWindow[windowId].splice(index, 1);
    browser.tabs.update(
      tabsByWindow[windowId][index <= 0 ? 0 : index - 1].id,
      {active: true})
    .catch(e => console.log(e));
  } else {
    tabsByWindow[windowId].splice(index, 1);
  }
  debug(tabsByWindow);
});
