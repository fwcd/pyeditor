import { equals } from "./equals";

export function arrayContains<T>(array: T[], value: T): boolean {
	for (let i=0; i<array.length; i++) {
		if (equals(array[i], value)) return true;
	}
	return false;
}
