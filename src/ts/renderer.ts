/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

import { Analyzer } from "./analyzer";

declare var amdRequire;
amdRequire(['vs/editor/editor.main'], setupEditor);

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

function setupEditor(): void {
	var editor = monaco.editor.create(document.getElementById('editor-widget'), {
		value: [
			'print(\'Hallo Welt!\')'
		].join('\n'),
		language: 'python',
		minimap: {
			enabled: false
		},
		scrollBeyondLastLine: false,
		autoIndent: true
	});
	// TODO: Observe model changes to update it's
	// options accordingly.
	editor.getModel().updateOptions({
		trimAutoWhitespace: false
	});
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
			getAnalyzer(model).parseEntire();
			return new monaco.Promise((resolve, reject) => {
				let list: monaco.languages.CompletionList = {
					isIncomplete: false,
					items: [
						{
							label: "Test",
							kind: monaco.languages.CompletionItemKind.Method
						}
					]
				};
				resolve(list);
			});
		}
	});
}
