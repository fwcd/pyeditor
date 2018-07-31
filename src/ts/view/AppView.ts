import { Editor } from "./Editor";
import { PythonRunner } from "../launch/PythonRunner";
import { TerminalView } from "./TerminalView";
import { VersionChooser } from "./VersionChooser";
import { MenuBar } from "./MenuBar";
import * as path from "path";
import { remote } from "electron";
import { DraggableElement } from "./DraggableElement";
import { Language } from "../model/Language";
import { FileLoaderModel } from "../model/FileLoaderModel";

const { Menu } = remote;

export class AppView {
	private version = "0.1";
	private language: Language;
	private versionChooser: VersionChooser;
	private terminal: TerminalView;
	private editor: Editor;
	private runner: PythonRunner;
	private repl: PythonREPL;
	
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
		this.language = language;
		
		this.setupEditor();
		this.setupSplitPane(elements.splitHandle, elements.terminal);
		this.setupVersionChooser(elements.versionChooser);
		this.setupTerminal(elements.terminal);
		this.setupRunToolBar(elements.runButtons);
		this.setupMenu();
		
		language.applyToDOM();
	}
	
	private setupEditor(): void {
		let fileLoaderModel = new FileLoaderModel();
		fileLoaderModel.currentPath.listen(filePath => {
			document.title = "PyEditor - " + path.basename(filePath);
		});
		this.editor = new Editor(this.language, fileLoaderModel);
	}
	
	private setupSplitPane(splitHandle: HTMLElement, terminalElement: HTMLElement): void {
		let splitPane = new DraggableElement(splitHandle);
		splitPane.onRelease = () => {
			this.terminal.relayout();
		}
		splitPane.onDrag = event => {
			terminalElement.style.height = window.innerHeight - event.y + "px";
		};
	}
	
	private setupVersionChooser(element: HTMLElement): void {
		this.versionChooser = new VersionChooser(element as HTMLSelectElement);
	}
	
	private setupTerminal(element: HTMLElement): void {
		this.terminal = new TerminalView(
			element,
			this.versionChooser,
			this.editor,
			this.language
		);
	}
	
	private setupRunToolBar(buttons: {
		runButton: HTMLElement,
		stepButton: HTMLElement,
		stopButton: HTMLElement,
		interpreterButton: HTMLElement
	}): void {
		this.runner = new PythonRunner(buttons, this.editor, this.terminal, this.language);
		this.repl = new PythonREPL(buttons.interpreterButton, this.terminal);
	}
	
	private setupMenu(): void {
		Menu.setApplicationMenu(new MenuBar(this).build());
	}
	
	public initializeEditor(): void {
		this.editor.initialize();
	}
	
	public getEditor(): Editor { return this.editor; }
	
	public getREPL(): PythonREPL { return this.repl; }
	
	public getRunner(): PythonRunner { return this.runner; }
	
	public getLanguage(): Language { return this.language; }
	
	public getVersion(): string { return this.version; }
}
