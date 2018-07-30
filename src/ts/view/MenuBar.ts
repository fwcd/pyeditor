import { AppView } from "./AppView";
import { remote } from "electron";

const { Menu } = remote;

export class MenuBar {
	private menuTemplate: Electron.MenuItemConstructorOptions[];
	
	public constructor(app: AppView) {
		this.menuTemplate = [
			{
				label: "Datei",
				submenu: [
					{
						label: "Öffnen",
						accelerator: "CmdOrCtrl+O",
						click(): void { app.getEditor().getFileLoader().open(); }
					},
					{
						label: "Speichern",
						accelerator: "CmdOrCtrl+S",
						click(): void { app.getEditor().getFileLoader().save(); }
					},
					{
						label: "Speichern unter",
						accelerator: "CmdOrCtrl+Shift+S",
						click(): void { app.getEditor().getFileLoader().saveAs(); }
					},
					{ type: "separator" },
					{
						label: "Starten",
						accelerator: "CmdOrCtrl+R",
						click(): void { app.getRunner().run(); }
					},
					{
						label: "Interpreter",
						accelerator: "CmdOrCtrl+Shift+R",
						click(): void { app.getREPL().run(); }
					}
				]
			},
			{
				label: "Bearbeiten",
				submenu: [
					{role: 'cut'},
					{role: 'copy'},
					{role: 'paste'}
				]
			},
			{
				label: "Über",
				submenu: [
					{
						label: "Über PyEditor",
						click(): void { alert("PyEditor v0.1 \n\n von fwcd"); }
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
