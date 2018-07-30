/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "../parse/Analyzer";
import { EditorLineHighlighter } from "./editorLineHighlighter";
import { FileLoader } from "./fileLoader";
import { EventBus } from "../utils/EventBus";
import { Language } from "../model/Language";

export class Editor {
	private model: monaco.editor.ITextModel = null;
	private editor: monaco.editor.IStandaloneCodeEditor;
	private highlighter: EditorLineHighlighter;
	private fileLoader: FileLoader;
	private eventBus: EventBus;
	private language: Language;
	
	public constructor(language: Language, eventBus: EventBus) {
		this.language = language;
		this.eventBus = eventBus;
	}
	
	public initialize(): void {
		let editorWidget = document.getElementById('editor');
		this.editor = monaco.editor.create(editorWidget, {
			value: [
				"print(\"" + this.language.get("hello-world") + "\")",
				""
			].join('\n'),
			language: 'python',
			minimap: {
				enabled: false
			},
			scrollBeyondLastLine: false,
			autoIndent: true,
			renderIndentGuides: false,
			wordBasedSuggestions: false,
			quickSuggestions: false
		});
		this.model = this.editor.getModel();
		let analyzer = new Analyzer(this.model);
		this.highlighter = new EditorLineHighlighter(this.editor);
		this.eventBus.subscribe("resize", () => this.editor.layout());
		this.model.updateOptions({
			trimAutoWhitespace: false,
			insertSpaces: true
		});
		this.fileLoader = new FileLoader(this.model, this.eventBus);
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
	
	public getHighlighter(): EditorLineHighlighter {
		return this.highlighter;
	}
}
