import { Observable } from "../utils/observable";

export class FileLoaderModel {
	readonly currentPath = new Observable<string>();
	readonly saved = new Observable<boolean>(false);
}
