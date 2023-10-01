let frame;
let shadow;
let page;

const notFoundClassName = "wiktionary-search";
const clippedClassName = "wiktionary-clipped";
const frameClassName = "wiktionary-frame";


const frameHeight = 350;
const frameWidth = 500;
const offsetX = 60;

function show(elem) {
    elem.style.display = "block";
}

function hide(elem) {
    elem.style.display = "none";
}

function createFrame(w, h) {
    frame = document.createElement("div");
    frame.setAttribute("class", frameClassName);
    frame.style.backgroundColor = "white";
    frame.style.position = "fixed";
    frame.style.width = `${w}px`;
    frame.style.height = `${h}px`;
    frame.style.overflowY = "auto";
    frame.style.borderStyle = "groove";
    frame.style.zIndex = 2147483647 // 2^31 - 1
    frame.style.direction = "ltr";
    document.body.append(frame);
    shadow = frame.attachShadow({ mode: "open" });
    hide(frame);
}

function applyStyle() {
    let style = document.createElement("style");
    style.textContent = `
		:host {
			all : initial;
            font-family: Segoe UI;
		}

        section {
            margin-left: 6px;
            margin-right: 6px;
        }

        .${clippedClassName},  {
            text-align: center;
            margin-top: 35%;
            font-weight: bold;
        }

        .${notFoundClassName} {
            margin-top: 6px;
            margin-left: 6px;
            font-size: 1.2em;
        }

        a.new {
            color: black;
        }
    `;
    shadow.append(style);
}


function onDoubleClick() {
    let word = getSelectedText().trim();
    if (!isValidWord(word)) return;
    word = preprocessWord(word);

    let p = window.getSelection().getRangeAt(0).getBoundingClientRect();
    let isOverflowingX = window.innerWidth - (p.x + offsetX) < frameWidth;
    let fx = isOverflowingX ? p.x - frameWidth : p.x;
    let fy = (window.innerHeight - frameHeight) / 2;
    updateFramePosition(fx, fy);

    cleanShadowRoot();
    fetchPage(word)
        .then(updatePage)
        .then(trimPage)
        .then(attachPage)
        .then(() => { show(frame); });
}

function isValidWord(word) {
    return word !== "";
}
function onEscape(ev) {
    if (ev.key === "Escape")
        hide(frame);
}

function onLinkClick(e) {
    e = e || window.event;
    let elem = e.target || e.srcElement;
    if (elem.tagName == 'A') {
        e.preventDefault();
        let href = elem.getAttribute("href");
        if (isValidLink(href) && isProbablyAWord(href))
            toNewWord(getWordFromLink(href), getLanguageFromLink(href));
        return false;
    }
}

function onClick(e) {
    e = e || window.event;
    let elem = e.target || e.srcElement;
    if (!frame.contains(elem))
        hide(frame);
}

function updateFramePosition(fx, fy) {
    frame.style.left = `${fx}px`;
    frame.style.top = `${fy}px`;
}

function getSelectedText() {
    if (window.getSelection) return window.getSelection().toString();
    else if (document.getSelection) return document.getSelection();
    else if (document.selection) return document.selection.createRange().text;
}

function wordURL(word) {
    return "https://en.wiktionary.org/api/rest_v1/page/html/" + word;
}

function searchURL(word) {
    return `https://en.wiktionary.org/w/api.php?action=opensearch&search=${word}&profile=engine_autoselect`;
}

function fetchPage(word) {
    return fetch(wordURL(word), { method: 'GET' })
        .then(res => {
            if (res.ok)
                return res.text();
            else if (res.status === 404)
                return fetch(searchURL(word), { method: "GET" })
                    .then(res => res.ok ? res.json() : {});
            else
                throw new Error('' + res.status + ': ' + res.statusText);
        })
        .catch(e => { console.error(e); });
}

function updatePage(content) {
    if (typeof content === "string") {
        const parser = new DOMParser();
        page = parser.parseFromString(content, 'text/html').body;
    } else {
        page = document.createElement("div");
        whenNotFound(content[1]);
        page.skipTrimming = true;
    }
}

function whenNotFound(variants) {
    text = document.createElement("div");
    text.setAttribute("class", notFoundClassName);
    text.innerHTML += "<p>Word definition not found, closest variants are:</p>"
    if (variants.length > 0) {
        let ul = document.createElement("ul");
        for (let word of variants)
            ul.innerHTML += `<li><a href = "./${word}">${word}</a></li>`;
        text.appendChild(ul);
    }
    page.append(text);
}


function trimPage(exceptions) {
    if (page.skipTrimming) return 0;
    preprocessPage(page);
    return browser.storage.local.get().then(res => {
        let languageList = new RemovalList(res.language.filter);
        if (exceptions && res.language.mode === M_EXCLUDE)
            for (let elem of exceptions) languageList.add(elem);
        runRemovalList(classify(page.children, [], [], true), languageList, res.language.mode);

        let layoutList = new RemovalList(res.layout.filter);
        for (let lang of page.children)
            runRemovalList(classify(lang.children, BLOCKS), layoutList, res.layout.mode);

        if (page.children.length === 0) whenClipped();
    });
}

function attachPage() {
    while (page.children.length > 0) shadow.append(page.children[0]);
}

function whenClipped() {
    text = document.createElement("div");
    text.setAttribute("class", clippedClassName);
    text.textContent = "No results found for the selected languages";
    page.append(text);
}

function cleanShadowRoot() {
    for (let i = shadow.children.length - 1; i >= 0; --i)
        if (shadow.children[i].tagName !== "STYLE") shadow.children[i].remove();
}

function toNewWord(word, lang) {
    let langExceptions = lang ? [lang] : [];
    cleanShadowRoot();
    fetchPage(word)
        .then(updatePage)
        .then(() => trimPage(langExceptions))
        .then(attachPage);
}

function isProbablyAWord(href) {
    return (href && href[0] === ".");
}
function getLanguageFromLink(href) {
    let i = href.indexOf("#");
    return (i > -1) ? href.substring(i + 1, href.length) : "";
}
function getWordFromLink(href) {
    let i = href.indexOf("#");
    return (i > -1) ? href.substring(2, i) : href.substring(2, href.length); // "./word#language" href[2] == "w"
}

function isValidLink(href) {
    return !(href.className && href.className.includes("new"));
}
