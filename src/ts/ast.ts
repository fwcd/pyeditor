import { StringSet, Set, ArraySet } from "./utils/set";

export class AST {
	readonly root: ASTNode;
	
	public constructor(lastLine: number) {
		this.root = new ASTNode(0, lastLine);
	}
	
	public nodeAt(line: number): ASTNode {
		return this.root.nodeAt(line);
	}
	
	public toString(): string {
		return this.root.toString();
	}
}

export class ASTNode {
	readonly startLine: number;
	parent?: ASTNode;
	endLine?: number;
	childs: ASTNode[] = [];
	localFunctions: ASTMethod[] = [];
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
	
	public getFunctions(): ASTMethod[] {
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

export interface ASTMethod {
	name: string;
	parameterNames: string[];
}

export interface ASTVariable {
	name: string;
	type: string;
}
