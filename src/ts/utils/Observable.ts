import { ListenerList } from "./listenerList";

export class Observable<T> {
	private value?: T;
	private listeners = new ListenerList<T>();
	
	public constructor(value?: T) {
		this.value = value;
	}
	
	public get(): T {
		return this.value;
	}
	
	public set(value: T): void {
		this.value = value;
		this.fire();
	}
	
	public fire(): void {
		this.listeners.fireWith(this.value);
	}
	
	public listen(listener: (value: T) => void): void {
		this.listeners.add(listener);
		if (this.value) {
			listener(this.value);
		}
	}
	
	public unlisten(listener: (value: T) => void): void {
		this.listeners.remove(listener);
	}
}
