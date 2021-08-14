import * as chalk from "chalk";
import { spawn } from "child_process";
import { Language } from "../model/Language";
import { TerminalModel } from "../model/TerminalModel";
import { DataProcess, TerminalProcess } from "../model/TerminalProcess";
import { VersionChooserModel } from "../model/VersionChooserModel";
import { PythonDebugSession } from "./PythonDebugSession";
import { ListenerList } from "../utils/ListenerList";
import { Observable } from "../utils/Observable";
import { FileLoaderModel } from "../model/FileLoaderModel";

export class PythonRunner {
	private terminal: TerminalModel;
	private versionChooser: VersionChooserModel;
	private fileLoader: FileLoaderModel;
	private debugSession?: PythonDebugSession;
	private startingDebugSession = false;
	private language: Language;
	private launches = 0;
	
	readonly highlightedLineNumber = new Observable<number>(0);
	readonly notificationListeners = new ListenerList<string>();
	
	public constructor(
		model: TerminalModel,
		versionChooser: VersionChooserModel,
		fileLoader: FileLoaderModel,
		language: Language
	) {
		this.terminal = model;
		this.versionChooser = versionChooser;
		this.fileLoader = fileLoader;
		this.language = language;
		
		this.terminal.process.preSetHandlers.push(() => {
			if (this.debugSession && !this.startingDebugSession) {
				this.debugSession.stop();
			}
		});
	}
	
	private getPythonCommand(): string {
		return this.versionChooser.pythonVersion.orElse("python3");
	}
	
	public runPythonShell(): void {
		this.kill();
		this.attach(DataProcess.fromChildProcess(spawn(this.getPythonCommand(), ["-i", "-u"])));
	}
	
	private attach(process: TerminalProcess): void {
		this.terminal.process.set(process);
	}
	
	public step(): void {
		if (this.debugSession) {
			this.debugSession.next();
		} else {
			let filePath = this.getFilePath();
			if (filePath) {
				this.kill();
				this.saveFile();
				this.startingDebugSession = true;
				this.debugSession = new PythonDebugSession(
					this.getPythonCommand(),
					this.getFilePath(),
					this.language
				);
				this.debugSession.notificationListeners.add(msg => {
					this.notificationListeners.fireWith(msg);
				})
				this.debugSession.lineNumber.listen(lineNr => {
					this.highlightedLineNumber.set(lineNr);
				});
				this.debugSession.exitListeners.add(() => {
					this.highlightedLineNumber.set(0);
					this.debugSession = null;
				});
				this.attach(this.debugSession);
				this.debugSession.start();
				this.startingDebugSession = false;
			}
		}
	}
	
	public run(): void {
		let filePath = this.getFilePath();
		if (filePath) {
			this.launches += 1;
			this.kill();
			this.saveFile();
			this.terminal.println(chalk.yellow(">> "
				+ this.language.get("program-launch")
				+ " #" + this.launches
			));
			this.attach(DataProcess.fromChildProcess(spawn(
				this.getPythonCommand(),
				[this.getFilePath()]
			)));
		}
	}
	
	private kill(): void {
		if (this.terminal.process.isPresent()) {
			this.terminal.process.get().kill();
		}
	}
	
	public stop(): void {
		this.kill();
		this.terminal.process.set(null);
	}
	
	private saveFile(): void {
		this.fileLoader.saveRequestListeners.fire();
	}
	
	private getFilePath(): string {
		let filePath = this.fileLoader.currentPath;
		if (filePath.isPresent()) {
			return filePath.get();
		} else {
			this.notificationListeners.fireWith(this.language.get("please-save-your-file"));
			return null;
		}
	}
}
