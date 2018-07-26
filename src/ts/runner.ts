import { Editor } from "./editor";
import { PythonTerminal } from "./terminal";
import { Language } from "./language";

export class Runner {
	private editor: Editor;
	private terminal: PythonTerminal;
	private lang: Language;
	
	public constructor(element: HTMLElement, editor: Editor, terminal: PythonTerminal, lang: Language) {
		this.editor = editor;
		this.terminal = terminal;
		this.lang = lang;
		
		element.addEventListener("click", () => this.run());
	}
	
	public run(): void {
		let fl = this.editor.getFileLoader();
		let filePath = fl.getCurrentFilePath();
		if (filePath) {
			if (fl.isUnsaved()) {
				fl.save();
			}
			this.terminal.run(filePath);
		} else {
			alert(this.lang.get("please-save-msg"));
		}
	}
}
