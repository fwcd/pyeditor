import { Observable } from "../utils/Observable";
import { TerminalProcess } from "./TerminalProcess";
import { ListenerList } from "../utils/ListenerList";

export class TerminalModel {
	readonly process = new Observable<TerminalProcess>();
	readonly writeListeners = new ListenerList<string>();
	readonly clearListeners = new ListenerList<void>();
	
	public print(text: string): void {
		this.writeListeners.fireWith(text);
	}
	
	public println(line: string): void {
		this.writeListeners.fireWith(line + "\n");
	}
	
	public clear(): void {
		this.clearListeners.fire();
	}
}
