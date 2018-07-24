export class StringSet {
	private values: { [key: string]: boolean; } = {};
	
	public add(...values: string[]): void {
		values.forEach(it => this.values[it] = true);
	}
	
	public remove(...values: string[]): void {
		values.forEach(it => delete this.values[it]);
	}
	
	public getValues(): string[] {
		return Object.keys(this.values);
	}
	
	public forEach(consumer: (v: string) => void): void {
		for (let value in this.values) {
			consumer(value);
		}
	}
	
	public union(other: StringSet): StringSet {
		let result = new StringSet();
		result.add(...this.getValues());
		result.add(...other.getValues());
		return result;
	}
}
