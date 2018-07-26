import { Terminal } from "xterm";
import { EVENT_BUS } from "./renderer";
import { Language } from "./language";
import * as fit from 'xterm/lib/addons/fit/fit';
import * as child_process from "child_process";
import chalk from "chalk";

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
	private lang: Language;
	private launches = 0;
	
	public constructor(element: HTMLElement, lang: Language) {
		this.lang = lang;
		this.terminal.open(element);
		this.terminal.fit();
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	public run(pythonProgramPath: string): void {
		this.launches += 1;
		this.terminal.write("\r");
		this.terminal.clear();
		this.terminal.writeln(">> " + this.lang.get("launch-nr") + this.launches);
		let proc = child_process.spawn("python3", [pythonProgramPath]);
		proc.stdout.on("data", data => {
			this.write(this.format(data));
		});
		proc.stderr.on("data", data => {
			this.write(chalk.redBright(this.format(data)));
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
