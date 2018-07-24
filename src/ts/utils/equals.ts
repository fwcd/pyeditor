/** Deeply checks two values for equality. */
export function equals(a: any, b: any): boolean {
	let arrA = Array.isArray(a);
	let arrB = Array.isArray(b);
	if (arrA || arrB) {
		if (arrA && arrB) {
			if (a.length === b.length) {
				for (let i=0; i<a.length; i++) {
					if (!equals(a[i], b[i])) return false;
				}
				return true;
			} else return false;
		} else return false;
	}
	let objA = typeof a === "object";
	let objB = typeof b === "object";
	if (objA || objB) {
		if (objA && objB) {
			let aKeys = Object.keys(a);
			let bKeys = Object.keys(b);
			if (aKeys.length !== bKeys.length) return false;
			for (let i=0; i<aKeys.length; i++) {
				let key = aKeys[i];
				if (!(key in b)) return false;
				if (!equals(a[key], b[key])) return false;
			}
			return true;
		} else return false;
	}
	return a === b;
}
