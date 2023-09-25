function init() {
    browser.storage.local.get()
        .then(updateUI)
}

function updateUI(options) {
    console.log(options);
    document.getElementById("save-button").onclick = updateOptions;

    for (const key of options.layout.filter) document.getElementById(key).checked = true;
    document.getElementById("layoutm-" + options.layout.mode).checked = true;
    document.getElementById("langm-" + options.language.mode).checked = true;
    document.getElementById("language-filter").value = options.language.filter.join(", ");
    for (const key in options.control) document.getElementById("control-" + key.toLowerCase()).checked = options.control[key];
}

function updateOptions() {
    let checkedLayout = document.querySelectorAll('input[type="checkbox"][name="layout-filter"]:checked');
    let layoutFilter = [];
    for (let elem of checkedLayout) layoutFilter.push(elem.id);

    let langFilter = document.getElementById("language-filter").value;
    langFilter = langFilter.length === 0 ? [] : langFilter.split(",").map(str => str.trim().replace(" ", "_"));

    browser.storage.local.set({
        control: {
            dblClick: document.getElementById("control-dblclick").checked,
            escOn: document.getElementById("control-escon").checked,
            autoHide: document.getElementById("control-autohide").checked,
        },

        language: {
            mode: parseInt(document.querySelector('input[type="radio"][name="lang-mode"]:checked').value),
            filter: langFilter
        },

        layout: {
            mode: parseInt(document.querySelector('input[type="radio"][name="layout-mode"]:checked').value),
            filter: layoutFilter
        }
    });
}

document.addEventListener("DOMContentLoaded", init);