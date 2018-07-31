import * as fs from "fs";
import { Language } from "../model/Language";

export function parseLanguageFrom(filePath: string): Language {
	let lang = new Language();
	fs.readFileSync(filePath, "utf-8")
		.split("\n")
		.forEach(line => {
			let splitted = line.split("=");
			lang.set(splitted[0], splitted[1])
		});
	return lang;
}
