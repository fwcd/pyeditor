import { arrayContains } from "./arrayUtils";

/** An unordered collection of unique items. */
export interface Set<T> {
	add(...added: T[]): void;
	
	remove(...removed: T[]): void;
	
	contains(value: T): boolean;
	
	getValues(): T[];
	
	union(other: Set<T>): Set<T>;
}

export class ArraySet<T> implements Set<T> {
	private values: T[];
	
	public constructor(values?: T[]) {
		this.values = values || [];
	}
	
	public add(...added: T[]): void {
		added.forEach(it => {
			if (!arrayContains(this.values, it)) {
				this.values.push(it);
			}
		});
	}
	
	public contains(value: T): boolean {
		return arrayContains(this.values, value);
	}
	
	public remove(...removed: T[]): void {
		this.values = this.values.filter(it => !arrayContains(removed, it));
	}
	
	public getValues(): T[] {
		return this.values;
	}
	
	public union(other: Set<T>): Set<T> {
		let result = new ArraySet<T>();
		result.add(...this.getValues());
		result.add(...other.getValues());
		return result;
	}
}

export class StringSet implements Set<string> {
	private values: { [key: string]: boolean; } = {};
	
	public add(...added: string[]): void {
		added.forEach(it => this.values[it] = true);
	}
	
	public remove(...removed: string[]): void {
		removed.forEach(it => delete this.values[it]);
	}
	
	public getValues(): string[] {
		return Object.keys(this.values);
	}
	
	public contains(value: string): boolean {
		return value in this.values;
	}
	
	public forEach(consumer: (v: string) => void): void {
		for (let value in this.values) {
			consumer(value);
		}
	}
	
	public union(other: Set<string>): Set<string> {
		let result = new StringSet();
		result.add(...this.getValues());
		result.add(...other.getValues());
		return result;
	}
}
