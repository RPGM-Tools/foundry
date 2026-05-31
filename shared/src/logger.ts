/**
 * File: logger.ts
 * Purpose: Wire the legacy Foundry runtime to the RPGM substrate logger
 *          helpers instead of carrying or re-exporting a duplicate Tools-era
 *          implementation.
 * Last Updated: 2026-05-31
 */
export {
	createModuleLogger,
	RpgmLogger
} from '../../../../rpgm-tools/rpgm/src/logging';
