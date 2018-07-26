import { Terminal } from "xterm";
import { EVENT_BUS } from "./renderer";
import { Language } from "./language";
import * as fit from 'xterm/lib/addons/fit/fit';
import * as child_process from "child_process";
import chalk from "chalk";
import { PythonChooser } from "./pythonChooser";

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
	private versionChooser: PythonChooser;
	
	public constructor(element: HTMLElement, versionChooser: PythonChooser, lang: Language) {
		this.lang = lang;
		this.versionChooser = versionChooser;
		this.terminal.open(element);
		this.terminal.fit();
		this.terminal.on("data", data => {
			let str = data.replace(/\r/g, '\n\r');
			this.input += str;
			this.terminal.write(str);
		});
		this.terminal.on("linefeed", () => {
			if (this.activeProcess) {
				this.activeProcess.stdin.write(this.input, "utf-8");
			}
			this.input = "";
		});
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	public run(pythonProgramPath: string): void {
		this.launches += 1;
		this.terminal.write("\r");
		this.terminal.clear();
		this.terminal.writeln(">> " + this.lang.get("launch-nr") + this.launches);
		this.activeProcess = child_process.spawn(this.versionChooser.getSelectedVersion() || "python", [pythonProgramPath]);
		this.activeProcess.stdout.on("data", data => {
			this.write(this.format(data));
		});
		this.activeProcess.stderr.on("data", data => {
			this.write(chalk.redBright(this.format(data)));
		});
		this.activeProcess.on("exit", () => {
			this.activeProcess = undefined;
		});
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
