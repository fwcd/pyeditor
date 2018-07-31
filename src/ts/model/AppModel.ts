import { TerminalModel } from "./TerminalModel";
import { VersionChooserModel } from "./VersionChooserModel";
import { FileLoaderModel } from "./FileLoaderModel";
import { Language } from "./Language";

export class AppModel {
	readonly terminal = new TerminalModel();
	readonly versionChooser = new VersionChooserModel();
	readonly fileLoader = new FileLoaderModel();
	readonly language: Language;
	
	public constructor(language: Language) {
		this.language = language;
	}
}
