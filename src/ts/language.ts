import * as path from "path";
import * as fs from "fs";

export class Language {
	private mappings: { [className: string]: string } = {};
	
	public setLangName(htmlClass: string, langName: string): void {
		this.mappings[htmlClass] = langName;
	}
	
	public getLangName(htmlClass: string): string {
		return this.mappings[htmlClass];
	}
	
	public apply(): void {
		for (let className in this.mappings) {
			let elements = document.getElementsByClassName(className);
			for (let i=0; i<elements.length; i++) {
				elements[i].innerHTML = this.mappings[className];
			}
		}
	}
}

export function parseLanguageFrom(fileName: string): Language {
	let lang = new Language();
	let filePath = path.join(__dirname, "..", fileName);
	fs.readFileSync(filePath, "utf-8")
		.split("\n")
		.forEach(line => {
			let splitted = line.split("=");
			lang.setLangName(splitted[0], splitted[1])
		});
	return lang;
}
