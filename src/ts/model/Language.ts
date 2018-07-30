import * as fs from "fs";

export class Language {
	private mappings: { [className: string]: string } = {};
	
	public set(htmlClass: string, langName: string): void {
		this.mappings[htmlClass] = langName;
	}
	
	public get(htmlClass: string): string {
		return this.mappings[htmlClass];
	}
	
	public applyToDOM(): void {
		for (let className in this.mappings) {
			let elements = document.getElementsByClassName(className);
			for (let i=0; i<elements.length; i++) {
				elements[i].innerHTML = this.mappings[className];
			}
		}
	}
}

export function parseLanguageFrom(filePath: string): Language {
	let lang = new Language();
	fs.readFileSync(filePath, "utf-8")
		.split("\n")
		.forEach(line => {
			let splitted = line.split("=");
			lang.set(splitted[0], splitted[1])
		});
	console.log("Lang: " + lang);
	return lang;
}
