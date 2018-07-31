import { Observable } from "../utils/observable";
import { TerminalProcess } from "./TerminalProcess";

export class TerminalModel {
	readonly process = new Observable<TerminalProcess>();
}
