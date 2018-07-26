import { remote } from "electron";
import * as fs from "fs";
import { EVENT_BUS } from "./renderer";

export class FileLoader {
	private model: monaco.editor.ITextModel;
	private currentFilePath?: string;
	
	public constructor(model: monaco.editor.ITextModel) {
		this.model = model;
		this.registerOpenButton(document.getElementById("open-file"));
		this.registerSaveButton(document.getElementById("save-file"));
		this.registerSaveAsButton(document.getElementById("save-file-as"));
	}
	
	private registerOpenButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.showOpenDialog());
	}
	
	private registerSaveButton(button: HTMLElement): void {
		button.addEventListener("click", () => {
			console.log(this.currentFilePath);
			if (this.currentFilePath) {
				this.saveFile(this.currentFilePath);
			} else {
				this.showSaveAsDialog();
			}
		});
	}
	
	private registerSaveAsButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.showSaveAsDialog());
	}
	
	private showOpenDialog(): void {
		remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			properties: ["openFile"]
		}, files => {
			if (files && files.length > 0) {
				this.openFile(files[0]);
			}
		});
	}
	
	private showSaveAsDialog(): void {
		remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}, fileName => {
			if (fileName) {
				this.saveFile(fileName);
			}
		});
	}
	
	private openFile(filePath: string): void {
		fs.readFile(filePath, "utf-8", (err, data) => {
			this.model.setValue(data);
			this.changeFilePathTo(filePath);
		});
	}
	
	private saveFile(filePath: string): void {
		console.log(filePath);
		fs.writeFile(filePath, this.model.getValue(), {
			encoding: "utf-8"
		}, err => {
			if (err) console.log(err);
		});
		this.changeFilePathTo(filePath);
	}
	
	private changeFilePathTo(filePath: string): void {
		if (!this.currentFilePath || (this.currentFilePath !== filePath)) {
			this.currentFilePath = filePath;
			EVENT_BUS.fire("changefilepath", filePath);
		}
	}
}
