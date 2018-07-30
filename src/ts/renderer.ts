import { AppView } from "./view/AppView";
import { parseLanguageFrom, Language } from "./model/Language";
import * as path from "path";
import { remote } from "electron";

const { app } = remote;

function readLanguage(langFileName: string): Language {
	try {
		return parseLanguageFrom(path.join(__dirname, "..", "lang", langFileName));
	} catch (err) {
		alert("Could not read language file: " + langFileName);
		app.quit();
	}
}

let langFileName = "english.txt";
let lang = readLanguage(langFileName);
let appView = new AppView(lang, {
	terminal: document.getElementById("terminal"),
	splitHandle: document.getElementById("split-handle"),
	versionChooser: document.getElementById("python-chooser"),
	runButtons: {
		runButton: document.getElementById("run-button"),
		stepButton: document.getElementById("step-button"),
		stopButton: document.getElementById("stop-button"),
		interpreterButton: document.getElementById("interpreter-button")
	}
});

// Monaco

declare var amdRequire;
amdRequire(['vs/editor/editor.main'], () => appView.initializeEditor());
