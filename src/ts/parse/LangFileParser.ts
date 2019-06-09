import * as fs from "fs";
import { Language } from "../model/Language";

export function parseLanguageFrom(filePath: string): Language {
	let lang = new Language();
	fs.readFileSync(filePath, "utf-8")
		.split("\n")
		.forEach(line => {
			let splitted = line.split("=");
			if (splitted.length == 2) {
				lang.set(splitted[0].trim(), splitted[1].trim());
			}
		});
	return lang;
}
