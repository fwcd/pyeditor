import { Editor } from "./Editor";
import { PythonTerminal } from "./PythonTerminal";
import { Language } from "../model/Language";

export class PythonRunner {
	private editor: Editor;
	private terminal: PythonTerminal;
	private language: Language;
	
	public constructor(
		buttons: {
			runButton: HTMLElement,
			stepButton: HTMLElement,
			stopButton: HTMLElement
		},
		editor: Editor,
		terminal: PythonTerminal,
		language: Language
	) {
		this.editor = editor;
		this.terminal = terminal;
		this.language = language;
		
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
			alert(this.language.get("please-save-your-file"));
		}
	}
}
