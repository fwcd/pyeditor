import { EventBus } from "../utils/EventBus";
import { Editor } from "./Editor";
import { PythonREPL } from "./PythonREPL";
import { PythonRunner } from "./PythonRunner";
import { PythonTerminal } from "./PythonTerminal";
import { VersionChooser } from "./VersionChooser";
import { MenuBar } from "./MenuBar";
import * as path from "path";
import { remote } from "electron";
import { DraggableElement } from "./DraggableElement";

const { Menu } = remote;

export class AppView {
	private eventBus = new EventBus();
	private versionChooser: VersionChooser;
	private terminal: PythonTerminal;
	private editor: Editor;
	private runner: PythonRunner;
	private repl: PythonREPL;
	
	public constructor(elements: {
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
		this.setupEventBus();
		this.setupEditor();
		this.setupSplitPane(elements.terminal);
		this.setupVersionChooser(elements.versionChooser);
		this.setupTerminal(elements.terminal);
		this.setupRunToolBar(elements.runButtons);
		this.setupMenu();
	}
	
	private setupEventBus(): void {
		window.addEventListener("resize", () => this.eventBus.fire("resize"));
		this.eventBus.subscribe("changefilepath", fileName => {
			document.title = "PyEditor - " + path.basename(fileName);
		});
	}
	
	private setupEditor(): void {
		this.editor = new Editor(this.eventBus);
	}
	
	private setupSplitPane(terminalElement: HTMLElement): void {
		let splitPane = new DraggableElement(document.getElementById("split-handle"));
		splitPane.onDrag = event => {
			this.eventBus.fire("resize");
			terminalElement.style.height = window.innerHeight - event.y + "px";
		};
		splitPane.onRelease = event => this.eventBus.fire("postresize");
	}
	
	private setupVersionChooser(element: HTMLElement): void {
		this.versionChooser = new VersionChooser(element as HTMLSelectElement);
	}
	
	private setupTerminal(element: HTMLElement): void {
		this.terminal = new PythonTerminal(element, this.versionChooser, this.editor, this.eventBus);
	}
	
	private setupRunToolBar(buttons: {
		runButton: HTMLElement,
		stepButton: HTMLElement,
		stopButton: HTMLElement,
		interpreterButton: HTMLElement
	}): void {
		this.runner = new PythonRunner(buttons, this.editor, this.terminal);
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
}
