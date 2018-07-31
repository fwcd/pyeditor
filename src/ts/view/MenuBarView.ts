import { AppView } from "./AppView";
import { remote } from "electron";

const { Menu } = remote;

export class MenuBarView {
	private menuTemplate: Electron.MenuItemConstructorOptions[];
	
	public constructor(app: AppView) {
		let lang = app.getLanguage();
		this.menuTemplate = [
			{
				label: lang.get("file-menu"),
				submenu: [
					{
						label: lang.get("open"),
						accelerator: "CmdOrCtrl+O",
						click(): void { app.getEditor().getFileLoader().showOpenDialog(); }
					},
					{
						label: lang.get("save"),
						accelerator: "CmdOrCtrl+S",
						click(): void { app.getEditor().getFileLoader().save(); }
					},
					{
						label: lang.get("save-as"),
						accelerator: "CmdOrCtrl+Shift+S",
						click(): void { app.getEditor().getFileLoader().showSaveAsDialog(); }
					},
					{ type: "separator" },
					{
						label: lang.get("run"),
						accelerator: "CmdOrCtrl+R",
						click(): void { app.getRunner().run(); }
					},
					{
						label: lang.get("run-interpreter"),
						accelerator: "CmdOrCtrl+Shift+R",
						click(): void { app.getRunner().runPythonShell(); }
					}
				]
			},
			{
				label: lang.get("edit-menu"),
				submenu: [
					{role: 'cut'},
					{role: 'copy'},
					{role: 'paste'}
				]
			},
			{
				label: lang.get("about-menu"),
				submenu: [
					{
						label: lang.get("about-pyeditor"),
						click(): void {
							alert("PyEditor v" + app.getVersion() + " \n\n " + lang.get("by-author"));
						}
					}
				]
			}
		];
		
		if (process.platform === "darwin") {
			// Insert application menu on macOS
			this.menuTemplate.unshift({
				label: "PyEditor",
				submenu: [
					{role: 'about'},
					{type: 'separator'},
					{role: 'services', submenu: []},
					{type: 'separator'},
					{role: 'hide'},
					{role: 'hideothers'},
					{role: 'unhide'},
					{type: 'separator'},
					{role: 'toggledevtools'},
					{type: 'separator'},
					{role: 'quit'}
				]
			});
		}
	}
	
	public build(): Electron.Menu {
		return Menu.buildFromTemplate(this.menuTemplate);
	}
}
