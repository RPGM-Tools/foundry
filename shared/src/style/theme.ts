import type { GlobalThemeOverrides } from 'naive-ui';
import { darkTheme, NConfigProvider } from 'naive-ui';

export const NaiveUIThemeOverrides = {
	common: {
		baseColor: '#ffffff',
		primaryColor: '#6633cc',
		primaryColorHover: '#855cd6',
		primaryColorPressed: '#5229a3',
		primaryColorSuppl: '#855cd6',
		actionColor: '#ff73c0',
		borderColor: '#fff',
		hoverColor: '#ff73c0',
		cardColor: 'rgb(24, 24, 28, 0.5)'
	},
	Typography: {
		textColorPrimary: '#855cd6'
	},
	Card: {
		borderRadius: '4px',
		paddingSmall: '4px',
		paddingMedium: '8px',
		paddingLarge: '12px',
		paddingHuge: '16px'
	}
} as const satisfies GlobalThemeOverrides;

export const NaiveTheme = defineComponent({
	name: 'NaiveTheme',
	setup(_, { slots }) {
		return () => h(NConfigProvider, {
			themeOverrides: NaiveUIThemeOverrides,
			abstract: true,
			theme: darkTheme
		}, slots.default);
	}
});
