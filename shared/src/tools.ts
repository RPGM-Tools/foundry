import { FoundyRpgmModuleMixin } from "./module";
import { AbstractTools } from "@rpgm/tools";

export class RpgmTools extends FoundyRpgmModuleMixin(AbstractTools) {
	override version: string = "0.0.0";
}
