import { clearChilds } from "./utils/domUtils";

let commandExists = require("command-exists");

export class PythonChooser {
	private element: HTMLSelectElement;
	private versions: string[] = [];
	
	public constructor(element: HTMLSelectElement) {
		this.element = element;
		clearChilds(element);
		this.addExisitingVersions(
			// Highest priority = highest index
			"python2",
			"python",
			"python3"
		);
	}
	
	private addExisitingVersions(...pythonCommands: string[]): void {
		let selectedPriority = -1;
		let index = 0;
		
		pythonCommands.forEach((version, priority) => {
			commandExists(version, (err, exists) => {
				if (exists) {
					this.versions.push(version)
					let option = document.createElement("option");
					option.value = version;
					option.label = version;
					this.element.appendChild(option);
					
					if (priority > selectedPriority) {
						this.element.selectedIndex = index;
						selectedPriority = priority;
					}
					
					index++;
				};
			});
		});
	}
	
	public getSelectedVersion(): string {
		return this.versions[this.element.selectedIndex];
	}
}
