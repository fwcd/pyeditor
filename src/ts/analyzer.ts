import { AST, ASTNode } from "./ast";

const functionMatcher = /\s*def ([\w]+)\((.*)\):/;
const variableMatcher = /\s*(\w+) = (\S+)/;

export class Analyzer {
	private ast: AST;
	private model: monaco.editor.ITextModel;
	
	public constructor(model: monaco.editor.ITextModel) {
		this.model = model;
		this.parseEntire();
	}
	
	public parseEntire(): void {
		let lastLine = this.model.getLineCount() - 1;
		this.ast = new AST(lastLine);
		this.parseScope(this.ast.root);
	}
	
	public getAST(): AST {
		return this.ast;
	}
	
	private parseScope(bottomNode: ASTNode): void {
		let lastIndent = 0;
		let nodeStack: ASTNode[] = [bottomNode];
		
		function peek(): ASTNode {
			return nodeStack[nodeStack.length - 1];
		}
		
		function popAndHookIntoNode(i: number): void {
			let child = nodeStack.pop();
			console.log("Hooking " + child.toString());
			let parent = peek();
			child.endLine = i;
			child.parent = parent;
			parent.childs.push(child);
		}
		
		let lines = this.model.getLinesContent();
		lines.forEach((line, i) => {
			let indent = this.detectIndentationLevel(line);
			
			if (indent > lastIndent) {
				let newNode = new ASTNode(i);
				console.log("Pushing " + newNode);
				nodeStack.push(newNode);
			} else if (indent < lastIndent) {
				popAndHookIntoNode(i);
			}
			
			let node = peek();
			
			let func = functionMatcher.exec(line);
			if (func && func.length > 0) {
				node.localFunctions.push({
					name: func[1],
					parameterNames: func[2].split(",").map(it => it.trim())
				});
				console.log(node.toString());
			}
			let variable = variableMatcher.exec(line);
			if (variable && variable.length > 0) {
				// let value = variable[2];
				let name = variable[1];
				node.localVariables.add(name);
			}
			
			lastIndent = indent;
		});
		
		while (nodeStack.length > 1) {
			popAndHookIntoNode(lines.length);
		}
	}
	
	private detectIndentationLevel(line: string): number {
		let indent = this.model.getOneIndent();
		let i = 0;
		let level = 0;
		while (i < line.length && this.matchesStr(indent, i, line)) {
			i += indent.length;
			level++;
		}
		return level;
	}
	
	private matchesStr(pattern: string, pos: number, base: string): boolean {
		let patternI = 0;
		for (let i=pos; i<base.length; i++) {
			if (pattern.charAt(patternI) != base.charAt(i)) {
				return false;
			}
			patternI++;
			if (patternI == pattern.length) {
				return true;
			}
		}
		return false;
	}
}
