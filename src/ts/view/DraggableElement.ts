export class DraggableElement {
	private dragged = false;
	onPress: (event: PointerEvent) => void = () => {};
	onDrag: (event: PointerEvent) => void = () => {};
	onRelease: (event: PointerEvent) => void = () => {};
	
	public constructor(handle: HTMLElement) {
		handle.addEventListener("pointerdown", e => {
			handle.setPointerCapture(e.pointerId);
			this.dragged = true;
			this.onPress(e);
		});
		handle.addEventListener("pointermove", e => {
			if (this.dragged) {
				this.onDrag(e);
			}
		});
		handle.addEventListener("pointerup", e => {
			handle.releasePointerCapture(e.pointerId);
			this.dragged = false;
			this.onRelease(e);
		});
	}
}
