/// <reference path="../../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "../parse/Analyzer";
import { EditorLineHighlighter } from "./EditorLineHighlighter";
import { FileLoaderView } from "./FileLoaderView";
import { Language } from "../model/Language";
import { FileLoaderModel } from "../model/FileLoaderModel";
import * as fs from "fs";

export class EditorView {
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
			autoIndent: "full",
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
		this.fileLoader.clearListeners.add(() => this.model.setValue(""));
		let analyzer = new Analyzer(this.model);
		this.highlighter = new EditorLineHighlighter(this.editor);
		this.setupLanguageConfig();
		this.setupCompletionProvider(analyzer);
		this.setupDefinitionProvider(analyzer);
	}
	
	public relayout(): void {
		if (this.editor) {
			this.editor.layout();
		}
	}
	
	private setupDefinitionProvider(analyzer: Analyzer): void {
		monaco.languages.registerDefinitionProvider('python', {
			async provideDefinition(model, pos, token): Promise<monaco.languages.Location | monaco.languages.Location[]> {
				analyzer.parseEntire(); // TODO: Incremental parsing
				let ast = analyzer.getAST();
				let node = ast.nodeAt(pos.lineNumber);
				let word = model.getWordAtPosition(pos).word;
				let declaration = ast.findVariable(word) || ast.findFunction(word);
				if (declaration) {
					let location = declaration.position;
					return {
						range: {
							startLineNumber: location.lineNumber + 1,
							endLineNumber: location.lineNumber + 1,
							startColumn: location.column,
							endColumn: location.column
						},
						uri: model.uri
					};
				} else {
					return [];
				}
			}
		});
	}

	private setupCompletionProvider(analyzer: Analyzer): void {
		monaco.languages.registerCompletionItemProvider('python', {
			async provideCompletionItems(model, pos, token): Promise<monaco.languages.CompletionList> {
				analyzer.parseEntire(); // TODO: Incremental parsing
				let ast = analyzer.getAST();
				let node = ast.nodeAt(pos.lineNumber);
				let list: monaco.languages.CompletionList = {
					incomplete: false,
					suggestions: node.getFunctions().map(it => <monaco.languages.CompletionItem>{
						label: it.name,
						detail: it.name + "(" + it.parameterNames + ")",
						kind: monaco.languages.CompletionItemKind.Function
					}).concat(node.getVariables().getValues().map(it => <monaco.languages.CompletionItem>{
						label: it.name,
						detail: it.type,
						kind: monaco.languages.CompletionItemKind.Variable
					}))
				};
				return list;
			}
		});
	}
	
	private setupFileLoader(fileLoaderModel: FileLoaderModel): void {
		this.fileLoader = new FileLoaderView(fileLoaderModel, this.language);
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
