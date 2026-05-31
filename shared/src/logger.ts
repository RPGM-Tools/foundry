/**
 * File: logger.ts
 * Purpose: Wire the legacy Foundry runtime to the already re-homed RPGM
 *          shared logger source instead of carrying a local duplicate.
 * Last Updated: 2026-05-31
 */
export { RpgmLogger } from '../../../tools/shared/src/logger';
