const tone_a = "āáǎà";
const tone_o = "ōóǒò";
const tone_e = "ēéěè";
const tone_i = "īíǐì";
const tone_u = "ǖǘǚǜü";

chrome.contextMenus.create({
    id: 'main',
    title: 'Copy to Pinyin',
    contexts: ["selection"],  // ContextType
});

chrome.contextMenus.onClicked.addListener(function ({ selectionText }) {
    fetch(`https://helloacm.com/api/pinyin/?cached&s=${selectionText}&t=1`).then((res) => res.json()).then(({ result }) => {
        const tones = addTones(result);
        console.log(tones);
        getCurrentTab().then(function (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: writeToClipboard,
                args: [selectionText, tones],
            });
        });
    });
});

async function getCurrentTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function writeToClipboard(originalText, pinyin) {
    console.log(originalText)
    let input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = originalText + '\n' + pinyin;
    input.select();
    document.execCommand("copy");
    input.remove();
}

function addTones(pinyin) {
    console.log(pinyin);
    let str = '';
    for (let i = 0; i < pinyin.length; ++i) {
        ts = pinyin[i];
        const tone = ts[ts.length - 1];
        ts = ts.split(',')[0].slice(0, -1);
        str += ts[0].toUpperCase();
        let ps = ts.substring(1);
        ps = ps.replace('a', tone_a[tone - 1]);
        ps = ps.replace('e', tone_e[tone - 1]);
        ps = ps.replace('i', tone_i[tone - 1]);
        ps = ps.replace('o', tone_o[tone - 1]);
        ps = ps.replace('u', tone_u[tone - 1]);
        str += ps;
        str += " ";
    }
    return str.trim();
}
