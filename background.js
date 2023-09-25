let defaultOptions = {
    control: {
        dblClick: true,
        autoHide: false,
        escOn: true
    },

    layout: {
        mode: 1,
        filter: []
    },
    language: {
        mode: 0,
        filter: ["English", "Chinese", "Arabic", "Spanish", "French", "Russian"]
    },
};

function checkStoredSettings(storedSettings) {
    if (!storedSettings.layout)
        browser.storage.local.set(defaultOptions);
}

function onError(e) {
    console.error(e);
}

function openOptions() {
    let opening = browser.tabs.create({
        url: "options/options.html"
    });
}

function addContextMenuItem() {
    browser.contextMenus.create({
        id: 'wiktionarek',
        title: 'Define "%s"',
        contexts: ["selection"]
    },
        () => void browser.runtime.lastError
    );

    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "wiktionarek") {
            let word = info.selectionText.trim();

            const code = `
                onDoubleClick();
            `
            browser.tabs.executeScript({
                code: "typeof onDoubleClick === 'function';",
            }).then((results) => {
                if (!results || results[0] !== true)
                    return browser.tabs.executeScript(tab.id, {
                        file: "frame-builder.js",
                    });
            }).then(() => {
                return browser.tabs.executeScript(tab.id, {code});
            }).catch((error) => {
                console.error("Failed to copy text: " + error);
            });
        }
    });
}

browser.browserAction.onClicked.addListener(openOptions);
const gettingStoredSettings = browser.storage.local.get();
gettingStoredSettings.then(checkStoredSettings, onError);
addContextMenuItem();

