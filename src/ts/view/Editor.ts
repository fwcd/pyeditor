/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "../parse/Analyzer";
import { EditorLineHighlighter } from "./editorLineHighlighter";
import { FileLoaderView } from "./FileLoaderView";
import { Language } from "../model/Language";
import { FileLoaderModel } from "../model/FileLoaderModel";
import * as fs from "fs";

export class Editor {
	private model: monaco.editor.ITextModel = null;
	private editor: monaco.editor.IStandaloneCodeEditor;
	private highlighter: EditorLineHighlighter;
	private fileLoader: FileLoaderView;
	private language: Language;
	
	public constructor(language: Language, fileLoaderModel: FileLoaderModel) {
		this.language = language;
		this.setupFileLoader(fileLoaderModel);
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
		this.model.onDidChangeContent(() => this.fileLoader.onChangeFile());
		this.model.updateOptions({
			trimAutoWhitespace: false,
			insertSpaces: true
		});
		let analyzer = new Analyzer(this.model);
		this.highlighter = new EditorLineHighlighter(this.editor);
		window.addEventListener("resize", () => this.editor.layout());
		this.setupLanguageConfig();
		this.setupCompletionProvider(analyzer);
		this.setupDefinitionProvider(analyzer);
	}
	
	private setupDefinitionProvider(analyzer: Analyzer): void {
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
						});
					}
					else {
						resolve([]);
					}
				});
			}
		});
	}

	private setupCompletionProvider(analyzer: Analyzer): void {
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
	}
	
	private setupFileLoader(fileLoaderModel: FileLoaderModel): void {
		this.fileLoader = new FileLoaderView(fileLoaderModel);
		this.fileLoader.saveListeners.add(filePath => {
			fs.writeFile(filePath, this.model.getValue(), {
				encoding: "utf-8"
			}, err => {
				if (err) console.log(err);
			});
		});
		this.fileLoader.openListeners.add(filePath => {
			fs.readFile(filePath, "utf-8", (err, data) => {
				this.model.setValue(data);
				this.fileLoader.onLoad(filePath);
			});
		});
	}

	private setupLanguageConfig(): void {
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
	}

	public getText(): string {
		return this.model.getValue();
	}
	
	public getFileLoader(): FileLoaderView {
		return this.fileLoader;
	}
	
	public getHighlighter(): EditorLineHighlighter {
		return this.highlighter;
	}
}
