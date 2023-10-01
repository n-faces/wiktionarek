function init() {
    createFrame(frameWidth, frameHeight);
    applyStyle();
    shadow.addEventListener("click", onLinkClick);

    browser.storage.local.get("control").then(res => {
        if (res.control.dblClick)
            document.addEventListener("dblclick", onDoubleClick);
        if (res.control.escOn)
            document.addEventListener("keydown", onEscape);
        if (!res.control.autoHide)
            document.addEventListener("click", onClick);
    })
}

if (document.readyState !== 'loading')
    init();
else
    document.addEventListener('DOMContentLoaded', init);