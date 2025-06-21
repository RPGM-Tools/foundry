export async function initSidebar() {
	const legacy = rpgm.majorGameVersion <= 12;
	const RpgmSidebar: foundry.applications.sidebar.AbstractSidebarTab = (await import(legacy ? "./legacy.ts" : "./modern.ts")).default;

	CONFIG.ui["rpgm"] = RpgmSidebar;
}
