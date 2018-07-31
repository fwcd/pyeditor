export class ListenerList<T> {
	private listeners: ((value: T) => void)[] = [];
	
	public fire(): void {
		this.fireWith(null);
	}
	
	public fireWith(value: T): void {
		this.listeners.forEach(it => it(value));
	}
	
	public add(listener: (value: T) => void): void {
		this.listeners.push(listener);
	}
	
	public remove(listener: (value: T) => void): void {
		this.listeners.splice(this.listeners.indexOf(listener), 1);
	}
	
	public count(): number {
		return this.listeners.length;
	}
}
