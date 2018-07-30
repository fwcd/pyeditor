export function strTrimLeading(pattern: string, base: string): string {
	if (base.indexOf(pattern) === 0) {
		return base.substring(pattern.length);
	} else {
		return base;
	}
}
