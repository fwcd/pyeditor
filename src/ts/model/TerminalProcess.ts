import { ListenerList } from "../utils/listenerList";
import { ChildProcess } from "child_process";
import { Socket } from "net";

export interface TerminalProcess {
	readonly outputLineListeners: ListenerList<string>;
	readonly outputErrorLineListeners: ListenerList<string>;
	readonly outputPartialLineListeners: ListenerList<string>;
	readonly exitListeners: ListenerList<void>;
	
	inputLine(line: string): void;
	
	kill(): void;
}

export class DataProcess implements TerminalProcess {
	readonly inputLine: (line: string) => void;
	readonly kill: () => void;
	readonly outputLineListeners = new ListenerList<string>();
	readonly outputErrorLineListeners = new ListenerList<string>();
	readonly outputPartialLineListeners = new ListenerList<string>();
	readonly exitListeners: ListenerList<void>;
	
	public constructor(
		inputLine: (line: string) => void,
		kill: () => void,
		dataOutputListeners: ListenerList<Buffer | string>,
		exitListeners: ListenerList<void>,
		errorOutputListeners?: ListenerList<Buffer | string>
	) {
		this.inputLine = inputLine;
		this.kill = kill;
		this.exitListeners = exitListeners;
		dataOutputListeners.add(data => this.onReceive(data, false));
		if (errorOutputListeners) {
			errorOutputListeners.add(data => this.onReceive(data, true));
		}
	}
	
	private format(data: Buffer | string): string {
		return (typeof data === "string" ? data : data.toString("utf-8")).replace(/[\r\n]+/, "\n");
	}
	
	private onReceive(data: Buffer | string, isError: boolean): void {
		let str = this.format(data);
		let lines = str.split("\n");
		for (let i=0; i<(lines.length - 1); i++) {
			let line = lines[i];
			if (isError) {
				this.outputErrorLineListeners.fireWith(line);
			} else {
				this.outputLineListeners.fireWith(line);
			}
		}
		this.outputPartialLineListeners.fireWith(lines[lines.length - 1]);
	}
	
	public static fromChildProcess(childProcess: ChildProcess): DataProcess {
		let inputLine = (line: string) => childProcess.stdin.write(line + "\n", "utf-8");
		let kill = () => childProcess.kill();
		let dataOutputListeners = new ListenerList<Buffer | string>();
		let errorOutputListeners = new ListenerList<Buffer | string>();
		let exitListeners = new ListenerList<void>();
		childProcess.stdout.on("data", data => dataOutputListeners.fireWith(data));
		childProcess.stderr.on("data", data => errorOutputListeners.fireWith(data));
		childProcess.on("exit", () => exitListeners.fire());
		return new DataProcess(inputLine, kill, dataOutputListeners, exitListeners, errorOutputListeners);
	}
	
	public static fromSocket(socket: Socket): DataProcess {
		let inputLine = (line: string) => socket.write(line + "\n", "utf-8");
		let kill = () => socket.destroy();
		let dataOutputListeners = new ListenerList<Buffer | string>();
		let exitListeners = new ListenerList<void>();
		socket.on("data", data => dataOutputListeners.fireWith(data));
		socket.on("close", () => exitListeners.fire());
		return new DataProcess(inputLine, kill, dataOutputListeners, exitListeners);
	}
}


