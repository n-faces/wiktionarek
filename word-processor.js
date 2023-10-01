function preprocessWord(word) {
    return preprocessArabic(word);
}

function preprocessArabic(word) {
    return isArabic(word) ? word.split("").filter(c => !isArabicDiacritic(c)).join("") : word;
}

function isArabic(word) {
    // U+0600 (1542) -> U+06ff (1791)
    return word.charCodeAt(0) >= 1542 && word.charCodeAt(0) <= 1791; 
}
function isArabicDiacritic(c) {
    let n = c.charCodeAt(0);
    // U+0610 (1552) -> U+061A (1562)
    // U+064B (1611) -> U+065F (1631)
    return (n >= 1552 && n <= 1562) || (n >= 1611 && n <= 1631);
}
