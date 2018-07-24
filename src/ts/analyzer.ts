import { AST, ASTNode } from "./ast";

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
	
	private parseScope(node: ASTNode): void {
		this.forLineIn(node, line => {
			let indent = this.detectIndentationLevel(line);
		});
	}
	
	private forLineIn(node: ASTNode, each: (line: string) => void): void {
		let allLines = this.model.getLinesContent();
		for (let i=node.startLine; i<=node.endLine; i++) {
			each(allLines[i]);
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
