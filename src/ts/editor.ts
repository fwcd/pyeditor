/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "./analyzer";
import { FileLoader } from "./fileLoader";
import { Language } from "./language";
import { EVENT_BUS } from "./renderer";
import { EditorLineHighlighter } from "./editorLineHighlighter";

export class Editor {
	private model: monaco.editor.ITextModel = null;
	private editor: monaco.editor.IStandaloneCodeEditor;
	private highlighter: EditorLineHighlighter;
	private fileLoader: FileLoader;
	private lang: Language;
	
	public constructor(language: Language) {
		this.lang = language;
	}
	
	public initialize(): void {
		let editorWidget = document.getElementById('editor');
		this.editor = monaco.editor.create(editorWidget, {
			value: [
				"print(\"" + this.lang.get("helloworld") + "\")",
				""
			].join('\n'),
			language: 'python',
			minimap: {
				enabled: false
			},
			scrollBeyondLastLine: false,
			autoIndent: true,
			renderIndentGuides: false
		});
		this.model = this.editor.getModel();
		let analyzer = new Analyzer(this.model);
		this.highlighter = new EditorLineHighlighter(this.editor);
		EVENT_BUS.subscribe("resize", () => this.editor.layout());
		this.model.updateOptions({
			trimAutoWhitespace: false,
			insertSpaces: true
		});
		this.fileLoader = new FileLoader(this.model);
		monaco.languages.setLanguageConfiguration('python', {
			onEnterRules: [
				{
					beforeText: /:$/,
					action: {
						indentAction: monaco.languages.IndentAction.Indent
					}
				}
			]
		});
		monaco.languages.registerCompletionItemProvider('python', {
			provideCompletionItems(model, pos, token): monaco.Promise<monaco.languages.CompletionList> {
				return new monaco.Promise((resolve, reject) => {
					analyzer.parseEntire(); // TODO: Incremental parsing
					let ast = analyzer.getAST();
					let node = ast.nodeAt(pos.lineNumber);
					let list: monaco.languages.CompletionList = {
						isIncomplete: false,
						items: node.getFunctions().map(it => <monaco.languages.CompletionItem>{
							label: it.name,
							detail: it.name + "(" + it.parameterNames + ")",
							kind: monaco.languages.CompletionItemKind.Function
						}).concat(node.getVariables().getValues().map(it => <monaco.languages.CompletionItem>{
							label: it.name,
							detail: it.type,
							kind: monaco.languages.CompletionItemKind.Variable
						}))
					};
					resolve(list);
				});
			}
		});
		monaco.languages.registerDefinitionProvider('python', {
			provideDefinition(model, pos, token): monaco.Promise<monaco.languages.Location | monaco.languages.Location[]> {
				return new monaco.Promise((resolve, reject) => {
					analyzer.parseEntire(); // TODO: Incremental parsing
					let ast = analyzer.getAST();
					let node = ast.nodeAt(pos.lineNumber);
					let word = model.getWordAtPosition(pos).word;
					let declaration = ast.findVariable(word) || ast.findFunction(word);
					if (declaration) {
						let location = declaration.position;
						resolve({
							range: {
								startLineNumber: location.lineNumber + 1,
								endLineNumber: location.lineNumber + 1,
								startColumn: location.column,
								endColumn: location.column
							},
							uri: model.uri
						})
					} else {
						resolve([]);
					}
				});
			}
		});
	}
	
	public getText(): string {
		return this.model.getValue();
	}
	
	public getFileLoader(): FileLoader {
		return this.fileLoader;
	}
}
