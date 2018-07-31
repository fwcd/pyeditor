import { clearChilds } from "../utils/domUtils";
import { VersionChooserModel } from "../model/VersionChooserModel";

let commandExists = require("command-exists");

export class VersionChooserView {
	private model: VersionChooserModel;
	private element: HTMLSelectElement;
	private versions: string[] = [];
	
	public constructor(model: VersionChooserModel, element: HTMLSelectElement) {
		this.model = model;
		this.element = element;
		clearChilds(element);
		this.addExisitingVersions(
			// Highest priority = highest index
			"python2",
			"python",
			"python3.7",
			"python3"
		);
		this.element.addEventListener("change", () => {
			this.model.pythonVersion.set(this.getSelectedVersionFromUI());
		});
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
	
	private getSelectedVersionFromUI(): string {
		return this.versions[this.element.selectedIndex];
	}
}
