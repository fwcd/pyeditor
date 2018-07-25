import { remote } from "electron";
import * as fs from "fs";

export class FileLoader {
	private model: monaco.editor.ITextModel;
	
	public constructor(model: monaco.editor.ITextModel) {
		this.model = model;
		this.registerOpenButton(document.getElementById("open-file"));
		this.registerSaveButton(document.getElementById("save-file"));
	}
	
	private registerOpenButton(button: HTMLElement): void {
		button.addEventListener("click", () => {
			remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
				properties: ["openFile"]
			}, files => {
				if (files && files.length > 0) {
					this.openFile(files[0]);
				}
			});
		});
	}
	
	private registerSaveButton(button: HTMLElement): void {
		button.addEventListener("click", () => {
			remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}, fileName => {
				if (fileName) {
					this.saveFile(fileName);
				}
			});
		});
	}
	
	private openFile(filePath: string): void {
		fs.readFile(filePath, "utf-8", (err, data) => {
			this.model.setValue(data);
		});
	}
	
	private saveFile(filePath: string): void {
		console.log(filePath);
		fs.writeFile(filePath, this.model.getValue(), {
			encoding: "utf-8"
		}, err => {
			if (err) console.log(err);
		});
	}
}
