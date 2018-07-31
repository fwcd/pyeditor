import chalk from "chalk";
import { clipboard } from "electron";
import { Terminal } from "xterm";
import * as fit from 'xterm/lib/addons/fit/fit';
import { TerminalModel } from "../model/TerminalModel";
import { TerminalProcess } from "../model/TerminalProcess";
import { ctrlOrCmdPressed } from "../utils/keyUtils";

// Apply and declare prototype extension method "fit()"
Terminal.applyAddon(fit);

let inputChar = /^[a-zA-Zß°äöüÄÖÜ1234567890!'"\\§$%&\/\(\)\=\?\+\-#\.,;:{}\[\]\*<>\| ]$/;
let newline = /[\r\n]+/;

declare module "xterm" {
	interface Terminal {
		fit(): void;
	}
}

export class TerminalView {
	private xterm = new Terminal({
		theme: {
			background: "rgb(29, 29, 29)"
		}
	});
	private history: string[] = [];
	private historyOffset = 0;
	private cachedCurrentInput = "";
	private input = "";
	private cursorOffset = 0;
	
	private model: TerminalModel;
	
	public constructor(
		model: TerminalModel,
		element: HTMLElement
	) {
		this.model = model;
		this.xterm.open(element);
		this.xterm.fit();
		this.xterm.attachCustomKeyEventHandler(event => this.firstKeyHandler(event));
		this.xterm.on("key", (key, event) => this.onKeyInTerminal(key, event));
		this.xterm.on("linefeed", () => this.onLineFeedInTerminal());
		model.process.preSetHandlers.push(() => this.clear());
		model.process.listen(process => {
			if (process) {
				this.attach(process);
				this.focus();
			} else {
				this.clear();
			}
		});
		model.clearListeners.add(() => this.clear());
		model.writeListeners.add(text => this.write(text));
	}
	
	private onLineFeedInTerminal(): void {
		this.cursorOffset = 0;
		if (this.input.length > 0) {
			this.history.push(this.input);
		}
		this.historyOffset = 0;
		this.cachedCurrentInput = "";
		this.input = "";
	}
	
	private firstKeyHandler(event: KeyboardEvent): boolean {
		if (ctrlOrCmdPressed(event) && event.key == "v") {
			let delta = clipboard.readText();
			this.insertAtCursor(delta);
			event.preventDefault();
			return false;
		} else {
			return true;
		}
	}
	
	private onKeyInTerminal(key: string, event: KeyboardEvent): void {
		if (event.code === "Backspace") {
			if (this.cursorOffset >= (-(this.input.length - 1))) {
				let cursorPos = this.input.length + this.cursorOffset;
				let left = this.input.substring(0, cursorPos);
				let right = this.input.substring(cursorPos, this.input.length);
				
				this.input = left.substring(0, left.length - 1) + right;
				this.xterm.write("\b" + right + " ");
				for (let i=0; i<(right.length + 1); i++) {
					this.xterm.write("\b");
				}
			}
		} else {
			if (event.code === "ArrowLeft") {
				if (this.cursorOffset > (-this.input.length)) {
					this.cursorOffset -= 1;
					this.xterm.write(key);
				}
			} else if (event.code === "ArrowRight") {
				if (this.cursorOffset < 0) {
					this.cursorOffset += 1;
					this.xterm.write(key);
				}
			} else if (event.code === "ArrowUp") {
				this.moveHistoryUp();
			} else if (event.code === "ArrowDown") {
				this.moveHistoryDown();
			} else if (inputChar.test(key)) {
				this.insertAtCursor(key);
			} else if (newline.test(key)) {
				if (this.model.process.isPresent()) {
					this.model.process.get().inputLine(this.input);
				}
				this.xterm.write("\n\r");
			}
		}
	}
	
	public relayout(): void {
		this.xterm.fit();
	}
	
	private insertAtCursor(delta: string): void {
		let cursorPos = this.input.length + this.cursorOffset;
		let left = this.input.substring(0, cursorPos);
		let right = this.input.substring(cursorPos, this.input.length);
		
		this.input = left + delta + right;
		this.xterm.write(delta);
		
		if (this.cursorOffset < 0) {
			this.xterm.write(right);
			for (let i=0; i<right.length; i++) {
				this.xterm.write("\b");
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
			this.xterm.write(" ");
			this.cursorOffset += 1;
		}
		for (let i=0; i<this.input.length; i++) {
			this.xterm.write("\b \b");
		}
		this.xterm.write(newInput);
		this.input = newInput;
		this.cursorOffset = 0;
	}
	
	private clear(): void {
		this.history = [];
		this.historyOffset = 0;
		this.cursorOffset = 0;
		this.input = "";
		this.cachedCurrentInput = "";
		this.xterm.reset();
	}
	
	private focus(): void {
		this.xterm.focus();
	}
	
	private attach(process: TerminalProcess): void {
		process.outputLineListeners.add(line => {
			this.write(line + "\n");
		});
		process.outputPartialLineListeners.add(text => {
			this.write(text);
		});
		process.outputErrorLineListeners.add(line => {
			this.write(chalk.redBright(line) + "\n");
		});
	}
	
	private write(data: string): void {
		let lines = data.split("\n");
		for (let i=0; i<(lines.length - 1); i++) {
			this.xterm.writeln(lines[i]);
		}
		this.xterm.write(lines[lines.length - 1]);
	}
}
