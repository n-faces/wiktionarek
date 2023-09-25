/* 
	This script looks through a section, classifies its elements and either 
    keeps them or removes them based on the options picked by the user
*/

/*
Last doc update 10.09.2023:
// 

At the time of writing this doc Wiktionary does provide its own data structure for users to fetch definitions 
from. This structure, however, is very barebone and lacks e.g. Etymology or Pronunciation, which for learners
may not be sufficient. That is why I've devised my own way of working around this issue. It is not guaranteed
that the HTML structure of a Wiktionary page will stay this way forever, and there will come a time when this
code ceases to work.

Terminology: 
(+) SECTION: A <section> tag
(+) BLOCK: A logical group of DOM elements that the user can choose to display or hide. 
    A block may not be  a section. For example, the Etymology portion of English „can” is logically a block, 
    but structurally consists of only an <h3> and a <p> tag with no wrapping section. 
    
    Blocks that are not sections can be difficult to deal with, which is why I made separate „preprocess”
    functions for them.
     
(+) CORE: A core block is a section that must contain, in order:
 - A header denoting the Part of speech
 - A <p> containing the Headword-line
 - An <ol> of the definitions for that particular Part of speech, which may contain other crucial elements

(+) COMPOSITE: A section containing multiple sections.
  !! Compositeness and core-ness are not multually exclusive. A section can be both composite and core.
*/

const RemovalList = Set;
function preprocessPage(page) {
    let elems = page.querySelectorAll(".floatright, figure, .mw-empty-elt");
    for (let i = elems.length - 1; i >= 0; --i) elems[i].remove();
}

const BLOCKS = [
    //["Variations", , ""],
    //["Wikipedia link", , "sister-wikipedia"],



    // Grammatical ----------------------------
    "Conjugation",
    "Usage_notes",
    "Declension",

    // Semantic relation ----------------------
    "Synonyms",
    "Antonyms",
    "Hypernyms",
    "Hyponyms",
    "Meronyms",
    "Holonyms",
    "Comeronyms",
    "Troponyms",
    "Parasynonyms",
    "Coordinate_term",
    "Otherwise_related",

    "Derived_terms",
    "Related_terms",
    "Collocations",
    "Descendants",
    "Translations",

    // Miscellaneous ----------------------------
    "Pronunciation",
    "Etymology",
    "Alternative_forms",
    "Trivia",
    "Anagrams",

    // References -------------------------------
    "See_also",
    "References",
    "Further_reading"

    //["Description", , ""], // Emoji
    //["Presentations", , ""], // Emoji
];

const TAGNAMES = [
    "FIGURE",
    "DL",
    "UL",
];

const TAGNAMES_MAP = new Map();
TAGNAMES_MAP.set("FIGURE","Image");
TAGNAMES_MAP.set("DL", "Example_sentences");
TAGNAMES_MAP.set("UL", "Quotations");

function getIDStem(elem) {
    if (!elem) return "";
    let s = elem.id;
    let i = s.search(/(_?\d)+/);
    return i > -1 ? s.slice(0, i) : s;
}

function getName(elem) {
    if (elem.children[0]) return getIDStem(elem.children[0]);
    return "";
}

function isSection(elem) {
    return elem.tagName === "SECTION";
}

// CI: Core Index
const HEADER_POS = 0;
const HEADWORD_POS = 1;
const LIST_POS = 2;
function isCore(elem) {
    if (elem.children.length < 3) return false;
    return elem.children[HEADER_POS].tagName.match(/H\d/) !== null &&
        elem.children[HEADWORD_POS].tagName === "P" &&
        elem.children[LIST_POS].tagName === "OL";
}

function isComposite(elem) {
    return Array.from(elem.children).some((child) => isSection(child));
}

// if block x contains "etymology", is composite but is not a core block.
// then [block x] - all sections = etymology.
// put etymology into a separate block.
function preprocessEtymology(elem) {
    let block = document.createElement("section");
    for (let i = elem.children.length - 1; i >= 0; --i)
        if (!isSection(elem.children[i])) block.prepend(elem.children[i]);
    elem.prepend(block);
}

// The argument to the function should be the definition list (aka the 3rd element of the core block with tag <OL>)
function classifyDefinitionList(root, res) {
    let elems = root.querySelectorAll(TAGNAMES.join(","));
    for (let elem of elems)
        res.push({ content: elem, key: TAGNAMES_MAP.get(elem.tagName) });
    return res;
}

function classify(root, filter, res, isShallow) {
    res = res || [];
    for (let i = root.length - 1; i >= 0; --i) {
        let elem = root[i];
        if (!isShallow) {
            if (isSection(elem)) {
                if (isCore(elem)) {
                    classifyDefinitionList(elem.children[LIST_POS], res);
                    classify(elem.children, filter, res, true);
                }
                else if (isComposite(elem)) {
                    if (getName(elem) === "Etymology")
                        preprocessEtymology(elem);
                    classify(elem.children, filter, res);
                }
            }
        }
        let name = getName(elem);
        if (filter.length === 0 || (filter.length > 0 && filter.includes(name))) 
            res.push({ content: elem, key: name });
    }
    return res;
}

const M_EXCLUDE = 0; // Mode 0: Remove element if not found in list
const M_INCLUDE = 1; // Mode 1: Remove element if found in list
function runRemovalList(elems, list, mode) {
    for (let i = 0; i < elems.length; ++i) {
        if (!(list.has(elems[i].key) ^ mode)) 
            elems[i].content.remove();
    }
}