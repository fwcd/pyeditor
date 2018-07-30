import { ChildProcess, spawn } from "child_process";
import { Observable } from "../utils/observable";
import { ListenerList } from "../utils/listenerList";
import * as path from "path";
import { Socket } from "net";
import chalk from "chalk";
import { Language } from "../model/Language";

export class PythonDebugSession {
	private language: Language;
	private serverPort = new Observable<number>();
	private pythonCommand: string;
	private pythonProgramPath: string;
	
	private jsonBuffer: string = "";
	private proc: ChildProcess;
	private socket: Socket;
	
	private stopped = false;
	private initialized = false;
	private attemptConnection = true;
	
	readonly lineNumber = new Observable<number>(0);
	readonly notificationListeners = new ListenerList<string>();
	readonly stdoutListeners = new ListenerList<string>();
	readonly stdoutBufferListeners = new ListenerList<string>();
	readonly stopListeners = new ListenerList<void>();
	
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
			this.handleRawStdout(this.formatRaw(data));
		});
		this.proc.stderr.on("data", data => {
			this.handleRawStdout(this.formatRaw(data));
			this.attemptConnection = false;
		});
		this.socket = new Socket();
		this.serverPort.listen(port => {
			this.socket.connect(port);
		});
		this.socket.on("error", err => {
			if (this.attemptConnection && !this.stopped) {
				this.stdoutListeners.fireWith(this.language.get("connecting"));
				window.setTimeout(() => {
					if (this.attemptConnection && !this.stopped) {
						this.socket.connect(this.serverPort.get());
					}
				}, 500);
			}
		});
		this.socket.on("connect", () => {
			this.attemptConnection = false;
		});
		this.socket.on("data", data => {
			this.handleRawJson(this.formatRaw(data));
		});
	}
	
	private jsonDebuggerPath(): string {
		return path.join(__dirname, "..", "..", "python", "json_debugger.py");
	}
	
	public next(): void {
		if (!this.stopped) {
			this.socket.write("{\"type\": \"continue\"}\n", "utf-8");
		}
	}
	
	private breakAt(lineNumber: number): void {
		this.lineNumber.set(lineNumber);
	}
	
	public stop(): void {
		this.stopped = true;
		this.stopListeners.fire();
		this.proc.kill();
		this.socket.destroy();
	}
	
	private handleStdoutLine(line: string): boolean {
		if (!this.stopped) {
			if (!this.initialized) {
				let port = JSON.parse(line).port;
				this.serverPort.set(port);
				this.proc.stdin.write("{\"type\": \"clientinit\"}\n", "utf-8");
				this.stdoutListeners.fireWith(chalk.yellow(">> "
					+ this.language.get("program-started-via-port")
					+ " " + port
				));
				this.stdoutListeners.fireWith(chalk.yellow(">> "
					+ this.language.get("debug-instructions")
				));
				this.initialized = true;
				return true;
			}
		}
		return false;
	}
	
	private handleJsonLine(line: string): void {
		if (!this.stopped) {
			let msg = JSON.parse(line);
			if (msg.type === "break") {
				this.breakAt(+msg.linenumber);
			} else if (msg.type === "finish") {
				this.stop();
			} else if (msg.type === "block") {
				let explanation = this.language.get("step-not-possible") + ": " + msg.cause;
				this.notificationListeners.fireWith(explanation);
			}
		}
	}
	
	private formatRaw(data: Buffer | string): string {
		return (typeof data === "string" ? data : data.toString("utf-8")).replace(/[\r\n]+/, "\n");
	}
	
	private handleRawStdout(data: string): void {
		if (!this.stopped) {
			let lines = data.split("\n");
			for (let i=0; i<(lines.length - 1); i++) {
				let line = lines[i];
				if (!this.handleStdoutLine(line)) {
					this.stdoutListeners.fireWith(line);
				}
			}
			this.stdoutBufferListeners.fireWith(lines[lines.length - 1]);
		}
	}
	
	private handleRawJson(data: string): void {
		if (!this.stopped) {
			let lines = (this.jsonBuffer + data).split("\n");
			this.jsonBuffer = "";
			for (let i=0; i<(lines.length - 1); i++) {
				this.handleJsonLine(lines[i]);
			}
			this.jsonBuffer += lines[lines.length - 1];
		}
	}
	
	public input(str: string): void {
		if (!this.stopped) {
			this.proc.stdin.write(str, "utf-8");
		}
	}
}
