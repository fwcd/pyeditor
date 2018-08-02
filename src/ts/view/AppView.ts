import { remote } from "electron";
import * as path from "path";
import { PythonRunner } from "../launch/PythonRunner";
import { AppModel } from "../model/AppModel";
import { Language } from "../model/Language";
import { DraggableElement } from "./DraggableElement";
import { EditorView } from "./EditorView";
import { MenuBarView } from "./MenuBarView";
import { TerminalView } from "./TerminalView";
import { VersionChooserView } from "./VersionChooserView";

const { Menu } = remote;

export class AppView {
	private version = "0.1";
	private model: AppModel;
	private terminal: TerminalView;
	private editor: EditorView;
	private runner: PythonRunner;
	
	public constructor(language: Language, elements: {
		terminal: HTMLElement,
		splitHandle: HTMLElement,
		versionChooser: HTMLElement,
		runButtons: {
			runButton: HTMLElement,
			stepButton: HTMLElement,
			stopButton: HTMLElement,
			interpreterButton: HTMLElement
		}
	}) {
		this.model = new AppModel(language);
		
		this.setupEditor();
		this.setupSplitPane(elements.splitHandle, elements.terminal);
		this.setupVersionChooser(elements.versionChooser);
		this.setupTerminal(elements.terminal);
		this.setupRunToolBar(elements.runButtons);
		this.setupMenu();
		
		language.applyToDOM();
	}
	
	private setupEditor(): void {
		this.editor = new EditorView(this.model.language, this.model.fileLoader);
		this.model.fileLoader.currentPath.listen(filePath => {
			if (filePath) {
				document.title = "PyEditor - " + path.basename(filePath);
			} else {
				document.title = "PyEditor";
			}
		});
		window.addEventListener("resize", () => this.editor.relayout());
	}
	
	private setupSplitPane(splitHandle: HTMLElement, terminalElement: HTMLElement): void {
		let splitPane = new DraggableElement(splitHandle);
		splitPane.onRelease = () => {
			this.terminal.relayout();
		}
		splitPane.onDrag = event => {
			terminalElement.style.height = window.innerHeight - event.y + "px";
			this.editor.relayout();
		};
	}
	
	private setupVersionChooser(element: HTMLElement): void {
		new VersionChooserView(
			this.model.versionChooser,
			element as HTMLSelectElement
		);
	}
	
	private setupTerminal(element: HTMLElement): void {
		this.terminal = new TerminalView(
			this.model.terminal,
			element
		);
	}
	
	private setupRunToolBar(buttons: {
		runButton: HTMLElement,
		stepButton: HTMLElement,
		stopButton: HTMLElement,
		interpreterButton: HTMLElement
	}): void {
		this.runner = new PythonRunner(
			this.model.terminal,
			this.model.versionChooser,
			this.model.fileLoader,
			this.model.language
		);
		this.runner.notificationListeners.add(msg => alert(msg));
		this.runner.highlightedLineNumber.listen(lineNr => {
			let lineHighlighter = this.editor.getHighlighter();
			if (lineNr > 0) {
				lineHighlighter.highlight(lineNr);
			} else {
				lineHighlighter.removeHighlightings();
			}
		});
		buttons.runButton.addEventListener("click", () => this.runner.run());
		buttons.stepButton.addEventListener("click", () => this.runner.step());
		buttons.stopButton.addEventListener("click", () => this.runner.stop());
		buttons.interpreterButton.addEventListener("click", () => this.runner.runPythonShell());
	}
	
	private setupMenu(): void {
		Menu.setApplicationMenu(new MenuBarView(this).build());
	}
	
	public initializeEditor(): void {
		this.editor.initialize();
	}
	
	public getEditor(): EditorView { return this.editor; }
	
	public getRunner(): PythonRunner { return this.runner; }
	
	public getLanguage(): Language { return this.model.language; }
	
	public getVersion(): string { return this.version; }
}
