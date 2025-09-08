import type { GlobalThemeOverrides } from 'naive-ui';
import { darkTheme, NConfigProvider } from 'naive-ui';
import type { App } from 'vue';

export const NaiveUIThemeOverrides = {
	common: {
		baseColor: '#ffffff',
		primaryColor: '#7d31ff',
		primaryColorHover: '#8855ff',
		primaryColorPressed: '#7100f1',
		primaryColorSuppl: '#7d31ff',
		successColor: '#01875a',
		successColorPressed: '#00764e',
		successColorHover: '#009866',
		successColorSuppl: '#01875a',
		warningColor: '#827201',
		warningColorPressed: '#726301',
		warningColorHover: '#938002',
		warningColorSuppl: '#827201',
		errorColor: '#cc0171',
		errorColorPressed: '#b40062',
		errorColorHover: '#e5027f',
		errorColorSuppl: '#cc0171',
		infoColor: '#205cff',
		infoColorPressed: '#043fff',
		infoColorHover: '#3a73ff',
		infoColorSuppl: '#205cff',
		borderColor: '#fff',
		cardColor: 'rgba(24, 24, 28, 0.5)'
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
	},
	Tag: {
		border: '2'
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

import {
	NAlert,
	NAvatar,
	NButton,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NDropdown,
	NElement,
	NEmpty,
	NFlex,
	NForm,
	NFormItem,
	NFormItemRow,
	NH1,
	NH2,
	NH3,
	NIcon,
	NImage,
	NInput,
	NList,
	NListItem,
	NNumberAnimation,
	NP,
	NPopover,
	NResult,
	NSelect,
	NSpin,
	NSwitch,
	NTab,
	NTabPane,
	NTabs,
	NTag,
	NText,
	NThing,
	NTooltip
} from 'naive-ui';

export type NaiveComponents = typeof NaiveComponents;

const NaiveComponents = {
	NAlert,
	NAvatar,
	NButton,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NDropdown,
	NElement,
	NEmpty,
	NFlex,
	NForm,
	NFormItem,
	NFormItemRow,
	NH1,
	NH2,
	NH3,
	NIcon,
	NImage,
	NInput,
	NList,
	NListItem,
	NNumberAnimation,
	NP,
	NPopover,
	NResult,
	NSelect,
	NSpin,
	NSwitch,
	NTab,
	NTabPane,
	NTabs,
	NTag,
	NText,
	NThing,
	NTooltip
} as const;

export function globalNaive(app: App) {
	for (const [name, component] of Object.entries(NaiveComponents)) {
		app.component(name, component);
	}
	return app;
}
