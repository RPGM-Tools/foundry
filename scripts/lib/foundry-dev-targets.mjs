const DEFAULT_PUBLIC_RPGM_BASE_URL = 'https://rpgm.tools';
const DEFAULT_BETA_RPGM_BASE_URL = 'https://beta.rpgm.tools';

const foundryDevTargets = {
	'v13-dev': {
		accountWebBaseUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		foundryUrl: 'https://foundryv13dev.rpgm.tools',
		foundryVersion: '13',
		label: 'Foundry 13 compatibility lane',
		probeUrl: 'https://foundryv13dev.rpgm.tools/game',
		profile: 'dev',
		proxyUrl: 'http://127.0.0.13:32013',
		remoteDataPath: '/home/ec2-user/foundry-data/v13-dev',
		remoteStartScript: '/home/ec2-user/bin/start-foundry-v13-dev.sh',
		stewardUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		viteHost: '127.0.0.13',
		vitePort: 32013
	},
	'v14-dev': {
		accountWebBaseUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		foundryUrl: 'https://foundryv14dev.rpgm.tools',
		foundryVersion: '14',
		label: 'Foundry 14 testing lane',
		probeUrl: 'https://foundryv14dev.rpgm.tools/game',
		profile: 'dev',
		proxyUrl: 'http://127.0.0.14:32014',
		remoteDataPath: '/home/ec2-user/foundry-data/v14-dev',
		remoteStartScript: '/home/ec2-user/bin/start-foundry-v14-dev.sh',
		stewardUrl: DEFAULT_PUBLIC_RPGM_BASE_URL,
		viteHost: '127.0.0.14',
		vitePort: 32014
	},
	'v13-beta': {
		accountWebBaseUrl: DEFAULT_BETA_RPGM_BASE_URL,
		foundryUrl: 'https://foundryv13dev.rpgm.tools',
		foundryVersion: '13',
		label: 'Foundry 13 beta compatibility lane',
		probeUrl: 'https://foundryv13dev.rpgm.tools/game',
		profile: 'dev',
		proxyUrl: 'http://127.0.1.13:32113',
		remoteDataPath: '/home/ec2-user/foundry-data/v13-dev',
		remoteStartScript: '/home/ec2-user/bin/start-foundry-v13-dev.sh',
		stewardUrl: DEFAULT_BETA_RPGM_BASE_URL,
		viteHost: '127.0.1.13',
		vitePort: 32113
	},
	'v14-beta': {
		accountWebBaseUrl: DEFAULT_BETA_RPGM_BASE_URL,
		foundryUrl: 'https://foundryv14dev.rpgm.tools',
		foundryVersion: '14',
		label: 'Foundry 14 beta testing lane',
		probeUrl: 'https://foundryv14dev.rpgm.tools/game',
		profile: 'dev',
		proxyUrl: 'http://127.0.1.14:32114',
		remoteDataPath: '/home/ec2-user/foundry-data/v14-dev',
		remoteStartScript: '/home/ec2-user/bin/start-foundry-v14-dev.sh',
		stewardUrl: DEFAULT_BETA_RPGM_BASE_URL,
		viteHost: '127.0.1.14',
		vitePort: 32114
	}
};

export {
	DEFAULT_BETA_RPGM_BASE_URL,
	DEFAULT_PUBLIC_RPGM_BASE_URL,
	foundryDevTargets
};

export function listFoundryDevTargetNames() {
	return Object.keys(foundryDevTargets);
}

export function resolveFoundryDevTarget(targetName) {
	return foundryDevTargets[targetName] ?? null;
}
