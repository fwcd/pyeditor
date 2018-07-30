import chalk from "chalk";
import * as child_process from "child_process";
import { Terminal } from "xterm";
import * as fit from 'xterm/lib/addons/fit/fit';
import { PythonChooser } from "./pythonChooser";
import { EVENT_BUS } from "./renderer";
import { PythonDebugSession } from "./pythonDebug";
import { Editor } from "./editor";

// Apply and declare prototype extension method "fit()"
Terminal.applyAddon(fit);

let inputChar = /^[a-zA-Zß°äöüÄÖÜ1234567890!'"\\§$%&\/\(\)\=\?\+\-#\.,;:{}\[\]\*<>\| ]$/;
let newline = /[\r\n]+/;

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
	private launches = 0;
	private debugSession?: PythonDebugSession;
	private editor: Editor;
	private versionChooser: PythonChooser;
	
	private cursorOffset = 0;
	
	public constructor(
		element: HTMLElement,
		versionChooser: PythonChooser,
		editor: Editor
	) {
		this.versionChooser = versionChooser;
		this.editor = editor;
		this.terminal.open(element);
		this.terminal.fit();
		this.terminal.on("key", (key, event) => {
			if (event.code === "Backspace") {
				if (this.cursorOffset >= (-(this.input.length - 1))) {
					let cursorPos = this.input.length + this.cursorOffset;
					let left = this.input.substring(0, cursorPos);
					let right = this.input.substring(cursorPos, this.input.length);
					
					this.input = left.substring(0, left.length - 1) + right;
					this.terminal.write("\b" + right + " ");
					for (let i=0; i<(right.length + 1); i++) {
						this.terminal.write("\b");
					}
				}
			} else {
				if (event.code === "ArrowLeft") {
					if (this.cursorOffset >= (-(this.input.length - 1))) {
						this.cursorOffset -= 1;
						this.terminal.write(key);
					}
				} else if (event.code === "ArrowRight") {
					if (this.cursorOffset < 0) {
						this.cursorOffset += 1;
						this.terminal.write(key);
					}
				} else if (event.code === "ArrowUp") {
					
				} else if (event.code === "ArrowDown") {
					
				} else if (inputChar.test(key)) {
					let cursorPos = this.input.length + this.cursorOffset;
					let left = this.input.substring(0, cursorPos);
					let right = this.input.substring(cursorPos, this.input.length);
					
					this.input = left + key + right;
					this.terminal.write(key);
					
					if (this.cursorOffset < 0) {
						this.terminal.write(right);
						for (let i=0; i<right.length; i++) {
							this.terminal.write("\b");
						}
					}
				} else if (newline.test(key)) {
					this.terminal.write("\n\r");
				}
			}
		});
		this.terminal.on("linefeed", () => {
			if (this.input.length > 0) {
				if (this.debugSession) {
					this.debugSession.input(this.input);
				} else if (this.activeProcess) {
					this.activeProcess.stdin.write(this.input.trim() + "\n", "utf-8");
				}
				this.cursorOffset = 0;
				this.input = "";
			}
		});
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	public runPythonShell(): void {
		this.stop();
		this.attach(child_process.spawn(this.getPythonCommand(), ["-i", "-u"]));
		this.focus();
	}
	
	public step(pythonProgramPath: string): void {
		if (this.debugSession) {
			this.debugSession.next();
		} else {
			this.stop();
			this.debugSession = new PythonDebugSession(this.getPythonCommand(), pythonProgramPath);
			this.debugSession.stdoutListeners.add(line => {
				this.terminal.writeln(line);
			});
			this.debugSession.stdoutBufferListeners.add(line => {
				this.terminal.write(line);
			});
			this.debugSession.notificationListeners.add(msg => {
				alert(msg);
			})
			let lineHighlighter = this.editor.getHighlighter();
			this.debugSession.lineNumber.listen(lineNr => {
				if (lineNr > 0) {
					lineHighlighter.highlight(lineNr);
				} else {
					lineHighlighter.removeHighlightings();
				}
			});
			this.debugSession.stopListeners.add(() => {
				lineHighlighter.removeHighlightings();
				this.debugSession = null;
			});
			this.debugSession.start();
		}
	}
	
	public stop(): void {
		if (this.activeProcess) {
			this.activeProcess.kill();
			this.removeActiveProcess();
		}
		if (this.debugSession) {
			this.debugSession.stop();
			this.debugSession = null;
		}
		this.terminal.reset();
	}
	
	public run(pythonProgramPath: string): void {
		this.launches += 1;
		this.stop();
		this.terminal.writeln(chalk.yellow(">> Programmstart Nr. " + this.launches));
		this.attach(child_process.spawn(
			this.getPythonCommand(),
			[pythonProgramPath]
		));
		this.focus();
	}
	
	private focus(): void {
		this.terminal.focus();
	}
	
	private getPythonCommand(): string {
		return this.versionChooser.getSelectedVersion() || "python3";
	}
	
	private attach(process: child_process.ChildProcess): void {
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
	}
	
	private removeActiveProcess(): void {
		this.activeProcess = null;
		this.debugSession = null;
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
