export class EventBus {
	private listeners: { [eventName: string]: ((event?: any) => void)[] } = {};
	
	public fire(eventName: string, event?: any): void {
		if (eventName in this.listeners) {
			this.listeners[eventName].forEach(it => it(event));
		};
	}
	
	public subscribe(eventName: string, listener: (event: any) => void): void {
		if (!(eventName in this.listeners)) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push(listener);
	}
	
	public unsubscribe(eventName: string, listener: (event: any) => void): void {
		let eventListeners = this.listeners[eventName];
		eventListeners.splice(eventListeners.indexOf(listener), 1);
	}
}
