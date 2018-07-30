import chalk from "chalk";
import * as child_process from "child_process";
import { Terminal } from "xterm";
import * as fit from 'xterm/lib/addons/fit/fit';
import { VersionChooser } from "./VersionChooser";
import { EVENT_BUS } from "./renderer";
import { PythonDebugSession } from "./PythonDebugSession";
import { Editor } from "./editor";
import { clipboard } from "electron";
import { ctrlOrCmdPressed } from "./utils/keyUtils";

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
	private launches = 0;
	private debugSession?: PythonDebugSession;
	private editor: Editor;
	private versionChooser: VersionChooser;
	
	private history: string[] = [];
	private historyOffset = 0;
	private cachedCurrentInput = "";
	private input = "";
	private cursorOffset = 0;
	
	public constructor(
		element: HTMLElement,
		versionChooser: VersionChooser,
		editor: Editor
	) {
		this.versionChooser = versionChooser;
		this.editor = editor;
		this.terminal.open(element);
		this.terminal.fit();
		this.terminal.attachCustomKeyEventHandler(event => {
			if (ctrlOrCmdPressed(event) && event.key == "v") {
				let delta = clipboard.readText();
				this.insertAtCursor(delta);
				event.preventDefault();
				return false;
			} else {
				return true;
			}
		});
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
					if (this.cursorOffset > (-this.input.length)) {
						this.cursorOffset -= 1;
						this.terminal.write(key);
					}
				} else if (event.code === "ArrowRight") {
					if (this.cursorOffset < 0) {
						this.cursorOffset += 1;
						this.terminal.write(key);
					}
				} else if (event.code === "ArrowUp") {
					this.moveHistoryUp();
				} else if (event.code === "ArrowDown") {
					this.moveHistoryDown();
				} else if (inputChar.test(key)) {
					this.insertAtCursor(key);
				} else if (newline.test(key)) {
					if (this.debugSession) {
						this.debugSession.input(this.input + "\n");
					} else if (this.activeProcess) {
						this.activeProcess.stdin.write(this.input + "\n", "utf-8");
					}
					this.terminal.write("\n\r");
				}
			}
		});
		this.terminal.on("linefeed", () => {
			this.cursorOffset = 0;
			if (this.input.length > 0) {
				this.history.push(this.input);
			}
			this.historyOffset = 0;
			this.cachedCurrentInput = "";
			this.input = "";
		});
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	private insertAtCursor(delta: string): void {
		let cursorPos = this.input.length + this.cursorOffset;
		let left = this.input.substring(0, cursorPos);
		let right = this.input.substring(cursorPos, this.input.length);
		
		this.input = left + delta + right;
		this.terminal.write(delta);
		
		if (this.cursorOffset < 0) {
			this.terminal.write(right);
			for (let i=0; i<right.length; i++) {
				this.terminal.write("\b");
			}
		}
	}
	
	private moveHistoryUp(): void {
		if (this.historyOffset === 0) {
			if (this.history.length > 0) {
				this.cachedCurrentInput = this.input;
				this.replaceLine(this.history[this.history.length - 1]);
				this.historyOffset = -1;
			}
		} else if (this.historyOffset > (-this.history.length)) {
			this.historyOffset -= 1;
			this.replaceLine(this.history[this.history.length + this.historyOffset]);
		}
	}
	
	private moveHistoryDown(): void {
		if (this.historyOffset < (-1)) {
			this.historyOffset += 1;
			this.replaceLine(this.history[this.history.length + this.historyOffset]);
		} else if (this.historyOffset === (-1)) {
			this.historyOffset = 0;
			this.replaceLine(this.cachedCurrentInput);
		}
	}
	
	private replaceLine(newInput: string): void {
		while (this.cursorOffset < 0) {
			this.terminal.write(" ");
			this.cursorOffset += 1;
		}
		for (let i=0; i<this.input.length; i++) {
			this.terminal.write("\b \b");
		}
		this.terminal.write(newInput);
		this.input = newInput;
		this.cursorOffset = 0;
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
		this.history = [];
		this.historyOffset = 0;
		this.cursorOffset = 0;
		this.input = "";
		this.cachedCurrentInput = "";
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
