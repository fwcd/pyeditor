import chalk from "chalk";
import * as child_process from "child_process";
import { Terminal } from "xterm";
import * as fit from 'xterm/lib/addons/fit/fit';
import { EditorLineHighlighter } from "./editorLineHighlighter";
import { Language } from "./language";
import { PythonChooser } from "./pythonChooser";
import { EVENT_BUS } from "./renderer";

// Apply and declare prototype extension method "fit()"
Terminal.applyAddon(fit);

declare module "xterm" {
	interface Terminal {
		fit(): void;
	}
}

export class PythonTerminal {
	private terminal = new Terminal({
		theme: {
			background: "rgb(29, 29, 29)"
		}
	});
	private activeProcess?: child_process.ChildProcess;
	private input = "";
	private lang: Language;
	private launches = 0;
	private lineHighlighter: EditorLineHighlighter;
	private versionChooser: PythonChooser;
	private isStepping = false;
	
	public constructor(
		element: HTMLElement,
		versionChooser: PythonChooser,
		lineHighlighter: EditorLineHighlighter,
		lang: Language
	) {
		this.lang = lang;
		this.versionChooser = versionChooser;
		this.lineHighlighter = lineHighlighter;
		this.terminal.open(element);
		this.terminal.fit();
		this.terminal.on("key", (key, event) => {
			if (event.keyCode == 8 /* Backspace */) {
				if (this.input.length > 0) {
					this.input = this.input.substring(0, this.input.length - 1);
				}
				this.terminal.write("\b \b");
			} else {
				let str = key.replace(/\r/g, '\n\r');
				this.input += str;
				this.terminal.write(str);
			}
		});
		this.terminal.on("linefeed", () => {
			if (this.input.length > 0 && this.activeProcess) {
				this.activeProcess.stdin.write(this.input.trim() + "\n", "utf-8");
			}
			this.input = "";
		});
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	public runPythonShell(): void {
		this.clear();
		this.attach(child_process.spawn(this.getPythonCommand(), ["-i", "-u"]));
		this.focus();
	}
	
	public step(pythonProgramPath: string): void {
		this.clear();
		this.attach(child_process.spawn(
			this.getPythonCommand(),
			["-m", "pdb", pythonProgramPath]
		), true);
	}
	
	private runWithStep(pythonProgramPath: string): void {
		this.launches += 1;
		this.clear();
		this.terminal.writeln(">> " + this.lang.get("launch-nr") + this.launches);
		this.attach(child_process.spawn(
			this.getPythonCommand(),
			[pythonProgramPath]
		));
		this.focus();
	}
	
	public stop(): void {
		if (this.activeProcess) {
			this.activeProcess.kill();
			this.removeActiveProcess();
		}
		this.clear();
	}
	
	public run(pythonProgramPath: string): void {
		this.launches += 1;
		this.clear();
		this.terminal.writeln(">> " + this.lang.get("launch-nr") + this.launches);
		this.attach(child_process.spawn(
			this.getPythonCommand(),
			[pythonProgramPath]
		));
		this.focus();
	}
	
	private clear(): void {
		this.terminal.reset();
	}
	
	private focus(): void {
		this.terminal.focus();
	}
	
	private getPythonCommand(): string {
		return this.versionChooser.getSelectedVersion() || "python";
	}
	
	private attach(process: child_process.ChildProcess, stepping?: boolean): void {
		this.activeProcess = process;
		this.activeProcess.stdout.on("data", data => {
			this.write(this.format(data));
		});
		this.activeProcess.stderr.on("data", data => {
			this.write(chalk.redBright(this.format(data)));
		});
		this.activeProcess.on("exit", () => {
			this.removeActiveProcess();
		});
		if (stepping) {
			this.isStepping = true;
		}
	}
	
	private removeActiveProcess(): void {
		this.activeProcess = undefined;
		this.isStepping = false;
	}
	
	private format(data: Buffer | string): string {
		return (typeof data === "string" ? data : data.toString("utf-8")).replace(/[\r\n]+/, "\n");
	}
	
	private write(data: string): void {
		let lines = data.split("\n");
		for (let i=0; i<(lines.length - 1); i++) {
			this.terminal.writeln(lines[i]);
		}
		this.terminal.write(lines[lines.length - 1]);
	}
}
