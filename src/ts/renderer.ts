import { AppView } from "./view/AppView";

let app = new AppView({
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
amdRequire(['vs/editor/editor.main'], () => app.initializeEditor());
