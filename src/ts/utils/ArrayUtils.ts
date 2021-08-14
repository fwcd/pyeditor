import { equals } from "./EqualityUtils";

export function arrayContains<T>(array: T[], value: T): boolean {
	for (let i=0; i<array.length; i++) {
		if (equals(array[i], value)) return true;
	}
	return false;
}
