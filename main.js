import { ZhongwenDictionary } from './dict.js';

const tone_a = 'āáǎàa';
const tone_o = 'ōóǒòo';
const tone_e = 'ēéěèe';
const tone_i = 'īíǐìi';
const tone_u = 'ūúǔùu';

let dict = null;

async function loadDictData() {
    let wordDict = fetch(chrome.runtime.getURL(
        'data/cedict_ts.u8')).then(r => r.text());
    let wordIndex = fetch(chrome.runtime.getURL(
        'data/cedict.idx')).then(r => r.text());
    let grammarKeywords = fetch(chrome.runtime.getURL(
        'data/grammarKeywordsMin.json')).then(r => r.json());

    return Promise.all([wordDict, wordIndex, grammarKeywords]);
}

async function loadDictionary() {
    let [wordDict, wordIndex, grammarKeywords] = await loadDictData();
    return new ZhongwenDictionary(wordDict, wordIndex, grammarKeywords);
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'main',
        title: 'Copy \'%s\' with Pinyin appended',
        contexts: ['selection'],  // ContextType
    });

    if (!dict) {
        dict = loadDictionary().then(loadedDict => dict = loadedDict);
    }
});

chrome.contextMenus.onClicked.addListener(function ({ selectionText }) {
    if (dict) {
        const pinyin = selectionText.split('').map(element => {
            const res = dict.wordSearch(element);
            if (!res) {
                return element;
            }
            const definition = res.data[0][0]
            var matches = definition.match(/\[(.*?)\]/);
            return addTone(matches[1]) + '';
        }).join(' ');

        getCurrentTab().then(function (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: writeToClipboard,
                args: [selectionText, pinyin],
            });
        });
    }
});

async function getCurrentTab() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

function writeToClipboard(originalText, pinyin) {
    const input = document.createElement('textarea');
    document.body.appendChild(input);
    input.value = originalText + '\n' + pinyin;
    input.select();
    document.execCommand('copy');
    input.remove();
}

function addTone(pinyin) {
    if (!pinyin) {
        return;
    }
    const tone = pinyin[pinyin.length - 1];
    pinyin = pinyin.split(',')[0].slice(0, -1);
    // From http://www.pinyin.info/rules/where.html
    if (pinyin.includes('ia') || pinyin.includes('ai') || pinyin.includes('ao') || pinyin.includes('ua')) {
        pinyin = pinyin.replace('a', tone_a[tone - 1]);
    } else if (pinyin.includes('ie') || pinyin.includes('ei') || pinyin.includes('ue')) {
        pinyin = pinyin.replace('e', tone_e[tone - 1]);
    } else if (pinyin.includes('ui')) {
        pinyin = pinyin.replace('i', tone_i[tone - 1]);
    } else if (pinyin.includes('io') || pinyin.includes('uo') || pinyin.includes('ou')) {
        pinyin = pinyin.replace('o', tone_o[tone - 1]);
    } else if (pinyin.includes('iu')) {
        pinyin = pinyin.replace('u', tone_u[tone - 1]);
    } else {
        pinyin = pinyin.replace('a', tone_a[tone - 1]);
        pinyin = pinyin.replace('e', tone_e[tone - 1]);
        pinyin = pinyin.replace('i', tone_i[tone - 1]);
        pinyin = pinyin.replace('o', tone_o[tone - 1]);
        pinyin = pinyin.replace('u', tone_u[tone - 1]);
    }
    return lowerFirstLetter(pinyin);
}

function lowerFirstLetter([first, ...rest]) {
    return first.toLowerCase() + rest.filter(a => a).join('');
}
