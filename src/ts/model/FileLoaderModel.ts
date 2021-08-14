import { Observable } from "../utils/Observable";
import { ListenerList } from "../utils/ListenerList";

export class FileLoaderModel {
	readonly currentPath = new Observable<string>();
	readonly saved = new Observable<boolean>(false);
	readonly isUnedited = new Observable<boolean>(true);
	readonly saveRequestListeners = new ListenerList<void>();
}
