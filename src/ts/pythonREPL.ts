import { PythonTerminal } from "./terminal";

export class PythonREPL {
	private element: HTMLElement;
	private terminal: PythonTerminal;
	
	public constructor(element: HTMLElement, terminal: PythonTerminal) {
		this.element = element;
		this.terminal = terminal;
		
		element.addEventListener("click", () => {
			this.run();
		});
	}
	
	public run(): void {
		this.terminal.runPythonShell();
	}
}
