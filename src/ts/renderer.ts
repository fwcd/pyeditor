/// <reference path="../../node_modules/monaco-editor/monaco.d.ts" />

declare var amdRequire;
amdRequire(['vs/editor/editor.main'], setupEditor);

function setupEditor() {
	var editor = monaco.editor.create(document.getElementById('editor-widget'), {
		value: [
			'print(\'Hallo Welt!\')'
		].join('\n'),
		language: 'python',
		minimap: {
			enabled: false
		}
	});
}
