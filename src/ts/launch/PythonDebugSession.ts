import { ChildProcess, spawn } from "child_process";
import { Observable } from "../utils/Observable";
import { ListenerList } from "../utils/ListenerList";
import * as path from "path";
import { Language } from "../model/Language";
import { TerminalProcess } from "../model/TerminalProcess";

export class PythonDebugSession implements TerminalProcess {
	private language: Language;
	private pythonCommand: string;
	private pythonProgramPath: string;
	
	private proc: ChildProcess;
	
	private stopped = false;
	
	readonly lineNumber = new Observable<number>(0);
	readonly notificationListeners = new ListenerList<string>();
	readonly outputLineListeners = new ListenerList<string>();
	readonly outputErrorLineListeners = new ListenerList<string>();
	readonly outputPartialLineListeners = new ListenerList<string>();
	readonly exitListeners = new ListenerList<void>();
	
	public constructor(
		pythonCommand: string,
		pythonProgramPath: string,
		language: Language
	) {
		this.pythonCommand = pythonCommand;
		this.pythonProgramPath = pythonProgramPath;
		this.language = language;
	}
	
	public start(): void {
		this.proc = spawn(
			this.pythonCommand,
			[
				"-u",
				this.jsonDebuggerPath(),
				"--file", this.pythonProgramPath
			]
		);
		this.proc.stdout.on("data", data => {
			this.handleRaw(this.formatRaw(data), false);
		});
		this.proc.stderr.on("data", data => {
			this.handleRaw(this.formatRaw(data), true);
		});
	}
	
	private jsonDebuggerPath(): string {
		return path.join(__dirname, "..", "..", "python", "json_debugger.py");
	}
	
	public next(): void {
		if (!this.stopped) {
			this.proc.stdin.write(JSON.stringify({ type: "continue" }) + "\n", "utf-8");
		}
	}
	
	private breakAt(lineNumber: number): void {
		this.lineNumber.set(lineNumber);
	}
	
	public stop(): void {
		if (!this.stopped) {
			this.stopped = true;
			this.exitListeners.fire();
			if (this.proc) this.proc.kill();
		}
	}
	
	private handleLine(line: string, isStderr: boolean): void {
		if (isStderr) {
			if (!this.stopped) {
				let msg = JSON.parse(line);
				if (msg) {
					switch (msg.type) {
					case "serverinit":
						this.proc.stdin.write(JSON.stringify({ type: "clientinit" }) + "\n", "utf-8");
						break;
					case "break":
						this.breakAt(+msg.linenumber);
						break;
					case "finish":
						this.stop();
						break;
					case "block":
						let explanation = this.language.get("step-not-possible") + ": " + msg.cause;
						this.notificationListeners.fireWith(explanation);
						break;
					default:
						console.error(`Unknown message type ${msg.type}`);
						break;
					}
					return;
				}
			}
			this.outputErrorLineListeners.fireWith(line);
		} else {
			this.outputLineListeners.fireWith(line);
		}
	}

	private formatRaw(data: Buffer | string): string {
		return (typeof data === "string" ? data : data.toString("utf-8")).replace(/[\r\n]+/, "\n");
	}
	
	private handleRaw(data: string, isStderr: boolean): void {
		if (!this.stopped) {
			let lines = data.split("\n");
			for (let i=0; i<(lines.length - 1); i++) {
				let line = lines[i];
				this.handleLine(line, isStderr);
			}
			this.outputPartialLineListeners.fireWith(lines[lines.length - 1]);
		}
	}
	
	public inputLine(line: string): void {
		if (!this.stopped) {
			this.proc.stdin.write(line + "\n", "utf-8");
		}
	}
	
	public kill(): void { this.stop(); }
}
