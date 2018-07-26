import { remote } from "electron";
import * as path from "path";
import { Editor } from "./editor";
import { EventBus } from "./eventBus";
import { parseLanguageFrom } from "./language";
import { PythonTerminal } from "./terminal";
import { Runner } from "./runner";
import { PythonChooser } from "./pythonChooser";
import { PythonREPL } from "./pythonREPL";

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

let editor = new Editor(lang);
declare var amdRequire;
amdRequire(['vs/editor/editor.main'], () => editor.initialize());

// Split pane

let splitHandle = document.getElementById("split-drag");
let splitDragged = false;
let terminalWidget = document.getElementById("terminal");

splitHandle.addEventListener("pointerdown", e => {
	splitHandle.setPointerCapture(e.pointerId);
	splitDragged = true;
});
splitHandle.addEventListener("pointermove", e => {
	if (splitDragged) {
		EVENT_BUS.fire("resize");
		terminalWidget.style.height = window.innerHeight - e.y + "px";
	}
});
splitHandle.addEventListener("pointerup", e => {
	splitHandle.releasePointerCapture(e.pointerId);
	splitDragged = false;
	EVENT_BUS.fire("postresize");
});

// Terminal

let versionChooser = new PythonChooser(document.getElementById("python-chooser") as HTMLSelectElement);
let terminal = new PythonTerminal(
	document.getElementById("terminal"),
	versionChooser,
	editor.getHighlighter(),
	lang
);
let runner = new Runner({
	runButton: document.getElementById("run-button"),
	stepButton: document.getElementById("step-button"),
	stopButton: document.getElementById("stop-button")
}, editor, terminal, lang);
let repl = new PythonREPL(document.getElementById("interpreter-button"), terminal);

// Menu bar

let menu: Electron.MenuItemConstructorOptions[] = [
	{
		label: lang.get("filemenu"),
		submenu: [
			{
				label: lang.get("open"),
				accelerator: "CmdOrCtrl+O",
				click(): void { editor.getFileLoader().open(); }
			},
			{
				label: lang.get("save"),
				accelerator: "CmdOrCtrl+S",
				click(): void { editor.getFileLoader().save(); }
			},
			{
				label: lang.get("save-as"),
				accelerator: "CmdOrCtrl+Shift+S",
				click(): void { editor.getFileLoader().saveAs(); }
			},
			{
				label: lang.get("run"),
				accelerator: "CmdOrCtrl+R",
				click(): void { runner.run(); }
			},
			{
				label: lang.get("run-interpreter"),
				accelerator: "CmdOrCtrl+Shift+R",
				click(): void { repl.run(); }
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
