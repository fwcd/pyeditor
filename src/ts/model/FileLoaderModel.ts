import { Observable } from "../utils/observable";
import { ListenerList } from "../utils/listenerList";

export class FileLoaderModel {
	readonly currentPath = new Observable<string>();
	readonly saved = new Observable<boolean>(false);
	readonly saveRequestListeners = new ListenerList<void>();
}
