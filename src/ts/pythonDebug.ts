import { ChildProcess, spawn } from "child_process";
import { Observable } from "./utils/observable";
import { ListenerList } from "./utils/listenerList";
import { strTrimLeading } from "./utils/stringUtils";

const pdbLinePattern = /> .+\(([1-9])\)/;
const finishPattern = /(?:The program finished and will be restarted)|(?:--Return--)/;

export class PythonDebugSession {
	private pythonCommand: string;
	private pythonProgramPath: string;
	private stdoutBuffer: string;
	private proc: ChildProcess;
	private stopped = false;
	readonly lineNumber = new Observable<number>(0);
	readonly stdoutListeners = new ListenerList<string>();
	readonly stopListeners = new ListenerList<void>();
	
	public constructor(pythonCommand: string, pythonProgramPath: string) {
		this.pythonCommand = pythonCommand;
		this.pythonProgramPath = pythonProgramPath;
	}
	
	public start(): void {
		this.proc = spawn(
			this.pythonCommand,
			["-m", "pdb", this.pythonProgramPath]
		);
		this.proc.stdout.on("data", data => {
			this.handleRawStdout(this.formatRawStdout(data));
		});
	}
	
	public next(): void {
		this.proc.stdin.write("next\n", "utf-8");
	}
	
	public stop(): void {
		this.stopped = true;
		this.stopListeners.fire();
		this.proc.kill();
	}
	
	private handleStdoutLine(line: string): void {
		if (!this.stopped) {
			let linePatternMatch = pdbLinePattern.exec(line);
			if (linePatternMatch && linePatternMatch.length > 1) {
				this.lineNumber.set(+linePatternMatch[1]);
			} else if (finishPattern.test(line)) {
				this.stop();
			} else if (line.indexOf("->") !== 0) {
				this.stdoutListeners.fireWith(strTrimLeading("(Pdb) ", line));
			}
		}
	}
	
	private formatRawStdout(data: Buffer | string): string {
		return (typeof data === "string" ? data : data.toString("utf-8")).replace(/[\r\n]+/, "\n");
	}
	
	private handleRawStdout(data: string): void {
		if (!this.stopped) {
			let lines = (this.stdoutBuffer + data).split("\n");
			this.stdoutBuffer = "";
			for (let i=0; i<(lines.length - 1); i++) {
				this.handleStdoutLine(lines[i]);
			}
			this.stdoutBuffer += lines[lines.length - 1];
			if (this.stdoutBuffer.trim() !== "(Pdb)") {
				this.handleStdoutLine(this.stdoutBuffer);
				this.stdoutBuffer = "";
			}
		}
	}
	
	public input(str: string): void {
		if (!this.stopped) {
			this.proc.stdin.write(str, "utf-8");
		}
	}
}
