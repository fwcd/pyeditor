import { Terminal } from "xterm";
import * as fit from 'xterm/lib/addons/fit/fit';
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
	
	public constructor(element: HTMLElement) {
		this.terminal.open(element);
		EVENT_BUS.subscribe("postresize", () => this.terminal.fit());
	}
	
	public println(line: string) {
		this.terminal.writeln(line);
	}
}
