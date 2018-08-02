import { remote } from "electron";
import { FileLoaderModel } from "../model/FileLoaderModel";
import { ListenerList } from "../utils/listenerList";
import { Language } from "../model/Language";

export class FileLoaderView {
	private language: Language;
	private model: FileLoaderModel;
	readonly saveListeners = new ListenerList<string>();
	readonly openListeners = new ListenerList<string>();
	readonly clearListeners = new ListenerList<string>();
	
	public constructor(model: FileLoaderModel, language: Language) {
		this.model = model;
		this.language = language;
		
		this.registerNewButton(document.getElementById("new-button"));
		this.registerOpenButton(document.getElementById("open-button"));
		this.registerSaveButton(document.getElementById("save-button"));
		this.registerSaveAsButton(document.getElementById("save-as-button"));
		
		let saveIcon = document.getElementById("save-icon") as HTMLImageElement;
		this.model.saved.listen(saved => {
			if (saved) {
				saveIcon.src = "img/saveInactiveIcon.png";
			} else {
				saveIcon.src = "img/saveIcon.png";
			}
		});
	}
	
	public onLoad(filePath: string): void {
		this.model.isUnedited.set(true);
		this.model.currentPath.set(filePath);
		this.model.saved.set(true);
	}
	
	public onChangeFile(): void {
		this.model.isUnedited.set(false);
		if (this.model.saved.get()) {
			this.model.saved.set(false);
		}
	}
	
	private registerNewButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.newFile());
	}
	
	private registerOpenButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.showOpenDialog());
	}
	
	private registerSaveButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.save());
	}
	
	private registerSaveAsButton(button: HTMLElement): void {
		button.addEventListener("click", () => this.showSaveAsDialog());
	}
	
	public showOpenDialog(): void {
		remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
			properties: ["openFile"]
		}, files => {
			if (files && (files.length > 0)) {
				if (this.confirmIfUnsaved()) {
					this.openFile(files[0]);
				}
			}
		});
	}
	
	public showSaveAsDialog(): void {
		remote.dialog.showSaveDialog(remote.getCurrentWindow(), {}, fileName => {
			if (fileName) {
				this.saveFile(fileName);
			}
		});
	}
	
	private confirmIfUnsaved(): boolean {
		if (this.model.saved.get() || this.model.isUnedited.get()) {
			return true;
		} else {
			return confirm(this.language.get("confirm-overwrite-unsaved"));
		}
	}
	
	public newFile(): void {
		if (this.confirmIfUnsaved()) {
			this.clearListeners.fire();
			this.model.currentPath.set(null);
			this.model.saved.set(true);
			this.model.isUnedited.set(true);
		}
	}
	
	public save(): void {
		if (this.model.currentPath.isPresent()) {
			this.saveFile(this.model.currentPath.get());
		} else {
			this.showSaveAsDialog();
		}
	}
	
	private openFile(filePath: string): void {
		this.openListeners.fireWith(filePath);
	}
	
	private saveFile(filePath: string): void {
		this.saveListeners.fireWith(filePath);
		this.model.currentPath.set(filePath);
		this.model.saved.set(true);
	}
}
