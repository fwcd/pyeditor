import { Observable } from "../utils/Observable";

export class VersionChooserModel {
	readonly pythonVersion = new Observable<string>("python3");
}
