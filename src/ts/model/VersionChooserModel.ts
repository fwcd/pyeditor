import { Observable } from "../utils/observable";

export class VersionChooserModel {
	readonly pythonVersion = new Observable<string>("python3");
}
