import { setupEditor } from "./editor";
import { EventBus } from "./eventBus";
import { parseLanguageFrom } from "./language";
import { PythonTerminal } from "./terminal";
import * as path from "path";
import { remote } from "electron";
import { FileLoader } from "./fileLoader";

const {Menu} = remote;

// Language

let lang = parseLanguageFrom("lang/german.txt");
lang.applyToDOM();

// Global event handling

export const EVENT_BUS = new EventBus();
window.addEventListener("resize", () => EVENT_BUS.fire("resize"));
EVENT_BUS.subscribe("changefilepath", fileName => {
	document.title = "PyEditor - " + path.basename(fileName);
});

// Monaco

let fileLoader: FileLoader;
declare var amdRequire;
amdRequire(['vs/editor/editor.main'], () => setupEditor(lang, fl => {
	fileLoader = fl;
}));

// Split pane

let splitHandle = document.getElementById("split-drag");
let splitDragged = false;
let terminal = document.getElementById("terminal");

splitHandle.addEventListener("pointerdown", e => {
	splitHandle.setPointerCapture(e.pointerId);
	splitDragged = true;
});
splitHandle.addEventListener("pointermove", e => {
	if (splitDragged) {
		EVENT_BUS.fire("resize");
		terminal.style.height = window.innerHeight - e.y + "px";
	}
});
splitHandle.addEventListener("pointerup", e => {
	splitHandle.releasePointerCapture(e.pointerId);
	splitDragged = false;
	EVENT_BUS.fire("postresize");
});

// Terminal

new PythonTerminal(document.getElementById("terminal")).println("Hello World!");

// Menu bar

let menu: Electron.MenuItemConstructorOptions[] = [
	{
		label: lang.get("filemenu"),
		submenu: [
			{
				label: lang.get("open"),
				accelerator: "CmdOrCtrl+O",
				click(): void { fileLoader.open(); }
			},
			{
				label: lang.get("save"),
				accelerator: "CmdOrCtrl+S",
				click(): void { fileLoader.save(); }
			},
			{
				label: lang.get("save-as"),
				accelerator: "CmdOrCtrl+Shift+S",
				click(): void { fileLoader.saveAs(); }
			}
		]
	}
];

if (process.platform === "darwin") {
	menu.unshift({
		label: "PyEditor",
		submenu: [
			{role: "about"},
			{type: 'separator'},
			{role: 'services', submenu: []},
			{type: 'separator'},
			{role: 'hide'},
			{role: 'hideothers'},
			{role: 'unhide'},
			{type: 'separator'},
			{role: 'quit'}
		]
	});
}

Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
