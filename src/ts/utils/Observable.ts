import { ListenerList } from "./listenerList";

export class Observable<T> {
	private value?: T;
	private listeners = new ListenerList<T>();
	readonly preSetHandlers: ((oldValue: T, newValue: T) => void)[] = [];
	
	public constructor(value?: T) {
		this.value = value;
	}
	
	public get(): T {
		return this.value;
	}
	
	public set(newValue: T): void {
		let oldValue = this.value;
		this.preSetHandlers.forEach(handler => {
			handler(oldValue, newValue);
		});
		if (!oldValue || (newValue !== oldValue)) {
			this.value = newValue;
			this.fire();
		}
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
	
	public orElse(defaultValue: T): T {
		if (this.value) {
			return this.value;
		}
	}
	
	public isPresent(): boolean {
		if (this.value) {
			return true;
		} else {
			return false;
		}
	}
}
