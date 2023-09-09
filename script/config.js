const pckg = require('../package.json');

const URL_MEK = 'https://mek.oszk.hu/00000/00076/';
const ICON_COPY = '&#9989;';

// config data for application
module.exports = {
	ENV: 'prod', /* dev | prod */
	AUTHOR: pckg.author.name,
	EMAIL: pckg.author.email,
	VERSION: pckg.version,
	TITLE: 'Angol-magyar szótár',
	WIN_ICON: './img/icon.ico',
	WIN_WIDTH: 800,
	WIN_HEIGHT: 600,
	WIN_MIN_WIDTH: 800,
	WIN_MIN_HEIGHT: 600,
	WIN_RESIZEABLE: true,
	WIN_CENTER: true,
	WIN_FRAME: true,
	WIN_HIDE_MENU: true,
	HTML_FILE_MAIN: 'main',
	QUIT_KEY: 'Ctrl+Q',
	URL_MEK: URL_MEK,
	TEXT_HELP: 'A szótár angol és magyar nyelvek közötti keresést tud végezni. Szavak és kifejezések kereshetőek mindkét nyelven a szótári tételek elején, közepén és végén, illetve van lehetőség a teljes egyezés szerinti keresésre is. Az utolsó keresési beállításokat megjegyzi az alkalmazás. A program a CTRL + Q billentyűkkel bezárható.<br><br>A teljes szóállomány Vonyó Attila gyűjtése, amelyet szíves engedélyével használok. A szótár jelenleg 254.867 szó- illetve kifejezés-párt tartalmaz. Más platformokon használható verziók:' + '&nbsp;<span id="url-copy" title="URL másolása">' + ICON_COPY + '&nbsp;</span>' + URL_MEK,

	isDev() {
		return (this.ENV === 'dev') ? true : false;
	},
};
