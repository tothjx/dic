//const {ipcRenderer} = require('electron');
const dic = require('../data/dic.json');
const cfg = require('../script/config');

const LINE                      = '========================================';
const MIN_WORD_SIZE             = 3;
const DEFAULT_LANG              = 'en';
const DEFAULT_WHERE             = 'middle';
const INPUT_WORD_SEL            = '#word';
const INPUT_WHERE_SEL           = 'input[name="where"]';
const INPUT_LANG_SEL            = 'input[name="lang"]';
const INPUT_WHERE_CHECKED_SEL   = INPUT_WHERE_SEL + ':checked';
const INPUT_LANG_CHECKED_SEL    = INPUT_LANG_SEL + ':checked';
const RESULTS_SEL               = '#results';
const BUTTON_SEARCH_SEL         = '#start-search';
const DIV_INFO_SEL              = '#info';
const MSG_NO_RESULTS            = 'Erre a szóra/kifejezésre nincs találat';
const MSG_SHORT_WORD            = 'A keresett szó túl rövid - minimum ' + MIN_WORD_SIZE + ' karakter szükséges a kereséshez';
const MSG_NUMBER_OF_RESULTS     = 'Találatok száma: ';
const INFO_TYPES                = ['info-red', 'info-green', 'info-blue', 'info-gray'];
const ABOUT_HEIGHT_MIN          = '36';
const ABOUT_HEIGHT_MAX          = '200';
const OPTIONS_KEY_PREFIX        = 'dictionaryOption';
const OPTIONS_KEY_FIRST_TIME    = OPTIONS_KEY_PREFIX + 'FirstTime';
const OPTIONS_KEY_LANG          = OPTIONS_KEY_PREFIX + 'Lang';
const OPTIONS_KEY_WHERE         = OPTIONS_KEY_PREFIX + 'Where';
const TITLE_ABOUT               = 'névjegy&nbsp;';
const ARROW_DOWN                = TITLE_ABOUT + '&#9660;';
const ARROW_UP                  = TITLE_ABOUT + '&#9650;';

let om = new optionsManager();
let word = '';
let lang = DEFAULT_LANG;
let where = DEFAULT_WHERE;

/*
// receiving data from main process
ipcRenderer.on('data', function (event, data) {
    console.log('data:', data);
});
*/

$(function() {
    if (cfg.isDev()) {
        showDevInfo();
    }

    // set options in localStorage
    if (om.init()) {
        lang = om.get(OPTIONS_KEY_LANG);
        where = om.get(OPTIONS_KEY_WHERE);
    }

    // set lang checked
    let radios_lang = $(INPUT_LANG_SEL);
    radios_lang.filter('[value=' + lang + ']').prop('checked', true);

    // set where checked
    let radios_where = $(INPUT_WHERE_SEL);
    radios_where.filter('[value=' + where + ']').prop('checked', true);

    // set about panel
    $('#about-title')
        .css('color', 'black')
        .html(cfg.TITLE + ' &bull; verzió: ' + cfg.VERSION);

    $('#about-arrow')
        .css('margin-left', '420px')
        .html(ARROW_DOWN);

    $('#about-email').html(
        'E-mail:&nbsp;<a href="mailto:' + cfg.EMAIL + '?subject=angol-magyar-szotar">' +
            cfg.EMAIL +
        '</a>'
    );

    $('#about-help').html(cfg.TEXT_HELP);

    $('#url-copy').click(function() {
        return copyTextToClipboard(cfg.URL_MEK);
    });

    $('#about-arrow').click(function(){
        let about_elem = $('#about');
        if (about_elem.css('height') != ABOUT_HEIGHT_MIN + 'px') {
            about_elem.animate({height: ABOUT_HEIGHT_MIN});
            $('#about-arrow').html(ARROW_DOWN);
        } else {
            about_elem.animate({height: ABOUT_HEIGHT_MAX});
            about_elem.css('height', 'auto');
            $('#about-arrow').html(ARROW_UP);
        }
    });

    $('#about-title').click(function (){
        $('#about-arrow').click();
    });

    // coloring search input and button
    $(INPUT_WORD_SEL).keyup(function(event) {
        if (checkWord()) {
            setWordClass('info-green');
        } else {
            setWordClass('info-red');
        }
    }).keypress(function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            $(BUTTON_SEARCH_SEL).click();
        }
    }).focus();

    // lang selection event
    $(INPUT_LANG_SEL).click(function(event) {
        lang = $(INPUT_LANG_CHECKED_SEL).val();
        om.set(OPTIONS_KEY_LANG, lang);
    });

    // where selection event
    $(INPUT_WHERE_SEL).click(function(event) {
        where = $(INPUT_WHERE_CHECKED_SEL).val();
        om.set(OPTIONS_KEY_WHERE, where);
    });

    // search
    $(BUTTON_SEARCH_SEL).click(function(event) {
        if (checkWord() && $(RESULTS_SEL).html('')) {
            word = $(INPUT_WORD_SEL).val().toLowerCase();
            let rows = sortResults(getResults(word, lang, where));
            if (rows.length > 0) {
                let tab = new table();
                let html = tab.create(rows);
                $(RESULTS_SEL).html(html);
                setInfoPanel('info-green', MSG_NUMBER_OF_RESULTS + rows.length);
            } else {
                setInfoPanel('info-red', MSG_NO_RESULTS);
            }
        } else {
            $(RESULTS_SEL).html('');
            return setInfoPanel('info-red', MSG_SHORT_WORD);
        }
    });
});

/**
 * @description check word's length
 * 
 * @returns boolean
 */
function checkWord() {
    return ($(INPUT_WORD_SEL).val().trim().length >= MIN_WORD_SIZE) 
        ? true : false; 
}

/**
 * @description reset info panel color
 * 
 * @returns {}
 */
function resetInfoPanel() {
    let panel = $(DIV_INFO_SEL);
    return INFO_TYPES.forEach((item, index) => {
        if (panel.hasClass(item)) {
            panel.removeClass(item);
        }
    });
}

/**
 * @description show info message and coloring info panel
 * 
 * @param {string} classname 
 * @param {string} message 
 * @returns {}
 */
function setInfoPanel(classname, message) {
    let panel = $(DIV_INFO_SEL);
    resetInfoPanel();
    return panel
        .addClass(classname)
        .html(message);
}

/**
 * @description coloring search input and button
 * 
 * @param {string} classname
 * @returns {}
 */
function setWordClass(classname) {
    let input_word = $(INPUT_WORD_SEL);
    let button_search = $(BUTTON_SEARCH_SEL);

    INFO_TYPES.forEach((item, index) => {
        // coloring input word
        if (input_word.hasClass(item)) {
            input_word.removeClass(item);
        }

        // coloring search button
        if (button_search.hasClass(item)) {
            button_search.removeClass(item);
        }
    });

    input_word.addClass(classname);
    button_search.addClass(classname);
}

/**
 * @description get results from dictionary
 * 
 * @param {string} word 
 * @param {string} lang 
 * @param {string} where
 * 
 * @returns array of objects
 */
function getResults(word, lang, where = 'middle') {
    switch(where) {
        case 'begin':
            return dic.filter(dic => dic[lang].startsWith(word));
        case 'end':
            return dic.filter(dic => dic[lang].endsWith(word));
        case 'full':
            return dic.filter(dic => dic[lang] == word);
        case 'middle':
        default:
            return dic.filter(dic => dic[lang].includes(word));
    }
}

/**
 * @description sorting of rows by language
 * 
 * @param {array} rws - rows
 * @returns {array of objects}
 */
function sortResults(rws) {
    return rws.sort((a, b) => (a[lang] > b[lang]) ? 1 : -1);
}

/**
 * @description get current date
 * 
 * @returns {string} datetime in readable format
 */
function getDateTime() {
    const zeroPad = (num, places) => String(num).padStart(places, '0');
    const dt = new Date();
    let ye = dt.getFullYear();
    let mo = zeroPad((dt.getMonth() + 1), 2);
    let da = zeroPad(dt.getDate(), 2);
    let ho = zeroPad(dt.getHours(), 2);
    let mi = zeroPad(dt.getMinutes(), 2);
    let se = zeroPad(dt.getSeconds(), 2);
    return [ye, mo, da].join('-') + ' ' + [ho, mi, se].join(':');
};

/**
 * @description copy text to clipboard
 * 
 * @param {string} text 
 * @returns boolean
 */
function copyTextToClipboard(text){
    var temp = document.createElement('textarea');
    document.body.appendChild(temp);
    temp.setAttribute('id', 'id_temp_text');
    document.getElementById('id_temp_text').value = text;
    temp.select();
    document.execCommand('copy');
    document.body.removeChild(temp);

    return true;
}

/**
 * @description html table for results
 * 
 * @returns {string} html for table
 */
function table() {
    this.data = {};
    this.html = '';

    // render table
    this.render = function () {
        return this.getHtml();
    }

    // create table
    this.create = function (rows) {
        this.data = {
            id: 'table-results',
            class: 'table-results',
            rows: rows,
            header: {
                id: 'header-results',
                class: 'header-standard',
                columns: [
                    {
                        id: 'column-null-header',
                        class: '',
                        title: '#'
                    },
                    {
                        id: 'column-one-header',
                        class: '',
                        title: (lang === 'en') ? 'angol' : 'magyar',
                    },
                    {
                        id: 'column-two-header',
                        class: '',
                        title: (lang === 'en') ? 'magyar' : 'angol',
                    },
                ],
            },
            columns: [
                {
                    value: 'NUM',
                    class: 'column-null-body',
                },
                {
                    value: lang,
                    class: 'column-one-body',
                },
                {
                    value: lang,
                    class: 'column-two-body',
                },
            ],
        };

        return this.render();
    }

    // get html for table
    this.getHtml = function () {
        let d = this.data;
        let counter = 0;
        let table_id = (d.id !== undefined) ? d.id : '';
        let table_class = (d.class !== undefined) ? d.class : '';
        let header_id = (d.header.id !== undefined) ? d.header.id : '';
        let header_class = (d.header.class !== undefined) ? d.header.class : '';
        let header_columns = (d.header.columns !== undefined) ? d.header.columns : '';
        let rows = (d.rows !== undefined) ? d.rows : {};

        // table
        this.html += '<table id="' + table_id + '" class="' + table_class + '"><thead>';

        // table header
        this.html += '<tr id="' + header_id + '" class="' + header_class + '">';
        header_columns.forEach((item, index, val) => {
            this.html += 
                '<td id="' + item.id + '" class="' + item.class + '">' + item.title + '</td>';
        });
        this.html += '</tr></thead><tbody>';

        // table rows
        rows.forEach((item, index) => {
            counter ++;
            let col_0 = counter;
            let col_1 = (d.columns[1].value === 'en') ? item.en : item.hu;
            let col_2 = (d.columns[1].value === 'en') ? item.hu : item.en;

            this.html += '<tr>' + 
                '<td class="' + d.columns[0].class + '">' + col_0  + '</td>' + 
                '<td class="' + d.columns[1].class + '">' + col_1  + '</td>' + 
                '<td class="' + d.columns[2].class + '">' + col_2 + '</td>' + 
                '</tr>';
        });

        this.html += '</tbody></table>'
        return this.html;
    }
}

/**
 * @description options manager for localStorage
 * 
 * @returns boolean
 */
function optionsManager() {
    // init data in localStorage
    this.init = function () {
        if (!this.get(OPTIONS_KEY_LANG)) {
            this.set(OPTIONS_KEY_LANG, DEFAULT_LANG);
        }
        if (!this.get(OPTIONS_KEY_WHERE)) {
            this.set(OPTIONS_KEY_WHERE, DEFAULT_WHERE);
        }
        if (!this.get(OPTIONS_KEY_FIRST_TIME)) {
            this.set(OPTIONS_KEY_FIRST_TIME, getDateTime());
        }

        return true;
    }

    // set data in localStorage
    this.set = function (name, value) {
        return window.localStorage.setItem(name, value);
    }

    // get data from localStorage
    this.get = function (name) {
        return window.localStorage.getItem(name);
    }
}

/**
 * @description write dev info to console
 * 
 * @returns {}
 */
function showDevInfo() {
    console.log('APPLICATION DATA');
    console.log(LINE);
    console.log('title:         ', cfg.TITLE);
    console.log('version:       ', cfg.VERSION);
    console.log('email:         ', cfg.EMAIL);
    console.log('help:          ', cfg.TEXT_HELP);
    console.log('isDev:         ', cfg.isDev());
    console.log('');
    console.log('SOFTWARE VERSIONS');
    console.log(LINE);
    console.log('node:          ', process.versions.node);
    console.log('electron:      ', process.versions.electron);
    console.log('chrome:        ', process.versions.chrome);
    console.log('v8:            ', process.versions.v8);
    console.log('');
}
