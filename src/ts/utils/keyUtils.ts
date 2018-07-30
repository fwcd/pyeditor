export function ctrlOrCmdPressed(event: KeyboardEvent): boolean {
	if (process.platform === "darwin") {
		// On macOS "Cmd" is considered to be the "metaKey"
		return event.metaKey;
	} else {
		return event.ctrlKey;
	}
}
