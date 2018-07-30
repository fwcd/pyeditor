import { remote } from "electron";
import * as path from "path";
import { Editor } from "./editor";
import { EventBus } from "./eventBus";
import { PythonChooser } from "./pythonChooser";
import { PythonREPL } from "./pythonREPL";
import { Runner } from "./runner";
import { PythonTerminal } from "./terminal";

const {Menu} = remote;

// Global event handling

export const EVENT_BUS = new EventBus();
window.addEventListener("resize", () => EVENT_BUS.fire("resize"));
EVENT_BUS.subscribe("changefilepath", fileName => {
	document.title = "PyEditor - " + path.basename(fileName);
});

// Monaco

let editor = new Editor();
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
	editor
);
let runner = new Runner({
	runButton: document.getElementById("run-button"),
	stepButton: document.getElementById("step-button"),
	stopButton: document.getElementById("stop-button")
}, editor, terminal);
let repl = new PythonREPL(document.getElementById("interpreter-button"), terminal);

// Menu bar

let menu: Electron.MenuItemConstructorOptions[] = [
	{
		label: "Datei",
		submenu: [
			{
				label: "Öffnen",
				accelerator: "CmdOrCtrl+O",
				click(): void { editor.getFileLoader().open(); }
			},
			{
				label: "Speichern",
				accelerator: "CmdOrCtrl+S",
				click(): void { editor.getFileLoader().save(); }
			},
			{
				label: "Speichern unter",
				accelerator: "CmdOrCtrl+Shift+S",
				click(): void { editor.getFileLoader().saveAs(); }
			},
			{ type: "separator" },
			{
				label: "Starten",
				accelerator: "CmdOrCtrl+R",
				click(): void { runner.run(); }
			},
			{
				label: "Interpreter",
				accelerator: "CmdOrCtrl+Shift+R",
				click(): void { repl.run(); }
			}
		]
	},
	{
		label: "Bearbeiten",
		submenu: [
			{role: 'cut'},
			{role: 'copy'},
			{role: 'paste'}
		]
	},
	{
		label: "Über",
		submenu: [
			{
				label: "Über PyEditor",
				click(): void { alert("PyEditor v0.1 \n\n von fwcd"); }
			}
		]
	}
];

if (process.platform === "darwin") {
	menu.unshift({
		label: "PyEditor",
		submenu: [
			{role: 'about'},
			{type: 'separator'},
			{role: 'services', submenu: []},
			{type: 'separator'},
			{role: 'hide'},
			{role: 'hideothers'},
			{role: 'unhide'},
			{type: 'separator'},
			{role: 'toggledevtools'},
			{type: 'separator'},
			{role: 'quit'}
		]
	});
}

Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
