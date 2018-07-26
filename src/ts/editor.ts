/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "./analyzer";
import { EVENT_BUS } from "./renderer";
import { FileLoader } from "./fileLoader";
import { Language } from "./language";

let cachedModel: monaco.editor.ITextModel = null;
let analyzer: Analyzer = null;

function getAnalyzer(model: monaco.editor.ITextModel): Analyzer {
	if (model == cachedModel) {
		return analyzer;
	} else {
		cachedModel = model;
		analyzer = new Analyzer(model);
		return analyzer;
	}
}

export function setupEditor(language: Language, fileLoaderCallback: (loader: FileLoader) => void): void {
	let editorWidget = document.getElementById('editor');
	let editor = monaco.editor.create(editorWidget, {
		value: [
			"print(\"" + language.get("helloworld") + "\")"
		].join('\n'),
		language: 'python',
		minimap: {
			enabled: false
		},
		scrollBeyondLastLine: false,
		autoIndent: true
	});
	let textModel = editor.getModel();
	EVENT_BUS.subscribe("resize", () => editor.layout());
	// TODO: Observe model changes to update it's
	// options accordingly.
	textModel.updateOptions({
		trimAutoWhitespace: false
	});
	fileLoaderCallback(new FileLoader(textModel));
	monaco.languages.setLanguageConfiguration('python', {
		onEnterRules: [
			{
				beforeText: /:/,
				action: {
					indentAction: monaco.languages.IndentAction.Indent
				}
			}
		]
	});
	monaco.languages.registerCompletionItemProvider('python', {
		provideCompletionItems(model, pos, token): monaco.Promise<monaco.languages.CompletionList> {
			return new monaco.Promise((resolve, reject) => {
				let analyzer = getAnalyzer(model);
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
				let analyzer = getAnalyzer(model);
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
