export class EventBus {
	private listeners: { [event: string]: (() => void)[] } = {};
	
	public fire(event: string): void {
		if (event in this.listeners) {
			this.listeners[event].forEach(it => it());
		};
	}
	
	public subscribe(event: string, listener: () => void): void {
		if (!(event in this.listeners)) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(listener);
	}
	
	public unsubscribe(event: string, listener: () => void): void {
		let eventListeners = this.listeners[event];
		eventListeners.splice(eventListeners.indexOf(listener), 1);
	}
}
