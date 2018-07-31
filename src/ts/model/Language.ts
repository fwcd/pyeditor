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
