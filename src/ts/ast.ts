export class AST {
	readonly root: ASTNode;
	
	public constructor(lastLine: number) {
		this.root = new ASTNode(0, lastLine);
	}
	
	public nodeAt(line: number): ASTNode {
		return this.root.nodeAt(line);
	}
}

export class ASTNode {
	readonly startLine: number;
	readonly endLine: number;
	private parent?: ASTNode;
	childs: ASTNode[] = [];
	localMethods: ASTMethod[] = [];
	localVariables: ASTVariable[] = [];
	
	public constructor(startLine: number, endLine: number, parent?: ASTNode) {
		this.parent = parent;
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
	
	public getMethods(): ASTMethod[] {
		if (this.parent) {
			return this.localMethods.concat(this.parent.getMethods());
		} else {
			return this.localMethods;
		}
	}
	
	public getVariables(): ASTVariable[] {
		if (this.parent) {
			return this.localVariables.concat(this.parent.getVariables());
		} else {
			return this.localVariables;
		}
	}
}

export interface ASTMethod {
	name: string;
	parameterNames: string[];
}

export interface ASTVariable {
	name: string;
}
