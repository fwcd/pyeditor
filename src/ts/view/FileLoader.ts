import { remote } from "electron";
import * as fs from "fs";
import { EventBus } from "../utils/EventBus";

export class FileLoader {
	private model: monaco.editor.ITextModel;
	private unsaved = false;
	private currentFilePath?: string;
	private eventBus: EventBus;
	
	public constructor(model: monaco.editor.ITextModel, eventBus: EventBus) {
		this.model = model;
		this.eventBus = eventBus;
		
		this.model.onDidChangeContent(() => {
			if (!this.unsaved) {
				this.unsaved = true;
				eventBus.fire("unsaved");
			}
		});
		
		this.registerOpenButton(document.getElementById("open-button"));
		this.registerSaveButton(document.getElementById("save-button"));
		this.registerSaveAsButton(document.getElementById("save-as-button"));
		
		let saveIcon = document.getElementById("save-icon") as HTMLImageElement;
		eventBus.subscribe("saved", () => saveIcon.src = "img/saveInactiveIcon.png");
		eventBus.subscribe("unsaved", () => saveIcon.src = "img/saveIcon.png");
	}
	
	private registerOpenButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.open());
	}
	
	private registerSaveButton(button: HTMLElement): void {
		button.addEventListener("click", () => {
			this.save();
		});
	}
	
	private registerSaveAsButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.saveAs());
	}
	
	public open(): void {
		remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			properties: ["openFile"]
		}, files => {
			if (files && files.length > 0) {
				this.openFile(files[0]);
			}
		});
	}
	
	public saveAs(): void {
		remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}, fileName => {
			if (fileName) {
				this.saveFile(fileName);
			}
		});
	}
	
	public save(): void {
		if (this.currentFilePath) {
			this.saveFile(this.currentFilePath);
		} else {
			this.saveAs();
		}
	}
	
	private openFile(filePath: string): void {
		fs.readFile(filePath, "utf-8", (err, data) => {
			this.model.setValue(data);
			this.changeFilePathTo(filePath);
			this.setSaved(filePath);
		});
	}
	
	private saveFile(filePath: string): void {
		fs.writeFile(filePath, this.model.getValue(), {
			encoding: "utf-8"
		}, err => {
			if (err) console.log(err);
		});
		this.changeFilePathTo(filePath);
		this.setSaved(filePath);
	}
	
	private changeFilePathTo(filePath: string): void {
		if (!this.currentFilePath || (this.currentFilePath !== filePath)) {
			this.currentFilePath = filePath;
			this.eventBus.fire("changefilepath", filePath);
		}
	}
	
	private setSaved(filePath: string): void {
		this.unsaved = false;
		this.eventBus.fire("saved", filePath);
	}
	
	public getCurrentFilePath(): string {
		return this.currentFilePath;
	}
	
	public isUnsaved(): boolean {
		return this.unsaved;
	}
}
