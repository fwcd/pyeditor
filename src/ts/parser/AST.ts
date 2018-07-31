import { StringSet, Set, ArraySet } from "../utils/set";

export class AST {
	readonly root: ASTNode;
	
	public constructor(lastLine: number) {
		this.root = new ASTNode(0, lastLine);
	}
	
	public findVariable(name: string): ASTVariable { return this.root.findVariable(name); }
	
	public findFunction(name: string): ASTFunction { return this.root.findFunction(name); }
	
	public nodeAt(line: number): ASTNode { return this.root.nodeAt(line); }
	
	public toString(): string { return this.root.toString(); }
}

export class ASTNode {
	readonly startLine: number;
	parent?: ASTNode;
	endLine?: number;
	childs: ASTNode[] = [];
	localFunctions: ASTFunction[] = [];
	localVariables: Set<ASTVariable> = new ArraySet();
	
	public constructor(startLine: number, endLine?: number) {
		this.startLine = startLine;
		this.endLine = endLine;
	}
	
	public nodeAt(line: number): ASTNode {
		let nodes = this.childs.filter(c => line >= c.startLine && line <= c.endLine);
		if (nodes.length > 0) {
			return nodes[0].nodeAt(line);
		} else {
			return this;
		}
	}
	
	public findVariable(name: string): ASTVariable {
		let matching = this.localVariables.getValues().filter(it => it.name === name);
		if (matching.length > 0) {
			return matching[0];
		} else {
			for (let i=0; i<this.childs.length; i++) {
				let variable = this.childs[i].findVariable(name);
				if (variable !== null) return variable;
			}
			return null;
		}
	}
	
	public findFunction(name: string): ASTFunction {
		let matching = this.localFunctions.filter(it => it.name === name);
		if (matching.length > 0) {
			return matching[0];
		} else {
			for (let i=0; i<this.childs.length; i++) {
				let func = this.childs[i].findFunction(name);
				if (func !== null) return func;
			}
			return null;
		}
	}
	
	public getFunctions(): ASTFunction[] {
		if (this.parent) {
			return this.localFunctions.concat(this.parent.getFunctions());
		} else {
			return this.localFunctions;
		}
	}
	
	public getVariables(): Set<ASTVariable> {
		if (this.parent) {
			return this.localVariables.union(this.parent.getVariables());
		} else {
			return this.localVariables;
		}
	}
	
	public toString(): string {
		return "<" + this.localFunctions.map(it => it.name + "()") + " ~ " + this.localVariables.getValues() + "> [" + this.childs + "]";
	}
}

export interface TextPosition {
	column: number;
	lineNumber: number;
}

export interface ASTFunction {
	name: string;
	parameterNames: string[];
	position: TextPosition;
}

export interface ASTVariable {
	name: string;
	type: string;
	position: TextPosition;
}
