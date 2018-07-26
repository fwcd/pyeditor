import { Editor } from "./editor";
import { PythonTerminal } from "./terminal";
import { Language } from "./language";

export class Runner {
	private editor: Editor;
	private terminal: PythonTerminal;
	private lang: Language;
	
	public constructor(
		buttons: {
			runButton: HTMLElement,
			stepButton: HTMLElement,
			stopButton: HTMLElement
		},
		editor: Editor,
		terminal: PythonTerminal,
		lang: Language
	) {
		this.editor = editor;
		this.terminal = terminal;
		this.lang = lang;
		
		buttons.runButton.addEventListener("click", () => this.run());
		buttons.stepButton.addEventListener("click", () => this.step());
		buttons.stopButton.addEventListener("click", () => this.stop());
	}
	
	public step(): void {
		this.withCurrentFile(it => this.terminal.step(it));
	}
	
	public stop(): void {
		this.terminal.stop();
	}
	
	public run(): void {
		this.withCurrentFile(it => this.terminal.run(it));
	}
	
	private withCurrentFile(callback: (filePath: string) => void): void {
		let fl = this.editor.getFileLoader();
		let filePath = fl.getCurrentFilePath();
		if (filePath) {
			if (fl.isUnsaved()) {
				fl.save();
			}
			callback(filePath);
		} else {
			alert(this.lang.get("please-save-msg"));
		}
	}
}
