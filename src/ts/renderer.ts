import { setupEditor } from "./editor";
import { EventBus } from "./eventBus";
import { parseLanguageFrom } from "./language";
import { PythonTerminal } from "./terminal";

export const EVENT_BUS = new EventBus();

declare var amdRequire;
amdRequire(['vs/editor/editor.main'], setupEditor);

window.addEventListener("resize", () => EVENT_BUS.fire("resize"));

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

parseLanguageFrom("lang/english.txt").apply();

new PythonTerminal(document.getElementById("terminal")).println("Hello World!");
