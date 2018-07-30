import { PythonTerminal } from "./PythonTerminal";

export class PythonREPL {
	private terminal: PythonTerminal;
	
	public constructor(element: HTMLElement, terminal: PythonTerminal) {
		this.terminal = terminal;
		
		element.addEventListener("click", () => {
			this.run();
		});
	}
	
	public run(): void {
		this.terminal.runPythonShell();
	}
}
