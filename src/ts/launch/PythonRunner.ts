import { Editor } from "../view/Editor";
import { TerminalView } from "../view/TerminalView";
import { Language } from "../model/Language";
import { VersionChooser } from "../view/VersionChooser";
import { PythonDebugSession } from "../PythonDebugSession";
import { TerminalModel } from "../model/TerminalModel";
import { VersionChooserModel } from "../model/VersionChooserModel";
import { version } from "punycode";
import { ChildProcess, spawn } from "child_process";
import { DataProcess } from "../model/TerminalProcess";

export class PythonRunner {
	private terminal: TerminalModel;
	private versionChooser: VersionChooserModel;
	private debugSession?: PythonDebugSession;
	private launches = 0;
	
	public constructor(model: TerminalModel, versionChooser: VersionChooserModel) {
		this.terminal = model;
		this.versionChooser = versionChooser;
	}
	
	private getPythonCommand(): string {
		return this.versionChooser.pythonVersion.orElse("python3");
	}
	
	public runPythonShell(): void {
		this.stop();
		this.attach(spawn(this.getPythonCommand(), ["-i", "-u"]));
	}
	
	private attach(process: ChildProcess): void {
		this.terminal.process.set(DataProcess.fromChildProcess(process));
	}
	
	public step(pythonProgramPath: string): void {
		if (this.debugSession) {
			this.debugSession.next();
		} else {
			this.stop();
			this.debugSession = new PythonDebugSession(this.getPythonCommand(), pythonProgramPath, this.language);
			this.debugSession.stdoutListeners.add(line => {
				this.xterm.writeln(line);
			});
			this.debugSession.stdoutBufferListeners.add(line => {
				this.xterm.write(line);
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
	
	public run(pythonProgramPath: string): void {
		this.launches += 1;
		this.stop();
		this.xterm.writeln(chalk.yellow(">> "
			+ this.language.get("program-launch")
			+ " #" + this.launches
		));
		this.attach(child_process.spawn(
			this.getPythonCommand(),
			[pythonProgramPath]
		));
		this.focus();
	}
	
	public stop(): void {
		if (this.terminal.process.isPresent()) {
			this.terminal.process.get().kill();
			this.terminal.process.set(null);
		}
	}
	
	private withCurrentFile(callback: (filePath: string) => void): void {
		let fl = this.editor.getFileLoader();
		let filePath = fl.getCurrentFilePath();
		if (filePath) {
			if (fl.isUnsaved()) {
				fl.save();
			}
			callback(filePath);
		} else {
			alert(this.language.get("please-save-your-file"));
		}
	}
}
