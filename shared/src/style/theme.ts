import type { GlobalThemeOverrides } from 'naive-ui';
import { createDiscreteApi, darkTheme, NConfigProvider } from 'naive-ui';
import type { App } from 'vue';

export const NaiveUIThemeOverrides = {
	common: {
		fontFamily: 'inherit',
		baseColor: '#ffffff',
		primaryColor: '#8560ed',
		primaryColorHover: '#9370ff',
		primaryColorPressed: '#7750dc',
		primaryColorSuppl: '#8560ed',
		successColor: '#249668',
		successColorPressed: '#02875a',
		successColorHover: '#39a677',
		successColorSuppl: '#249668',
		// warningColor: '#91811f',
		// warningColorPressed: '#827202',
		// warningColorHover: '#a09032',
		// warningColorSuppl: '#91811f',
		warningColor: '#ac721f',
		warningColorPressed: '#9c6402',
		warningColorHover: '#bc8232',
		warningColorSuppl: '#ac721f',
		errorColor: '#de2780',
		errorColorPressed: '#cc0171',
		errorColorHover: '#f13d8f',
		errorColorSuppl: '#de2780',
		infoColor: '#4578ee',
		infoColorPressed: '#3768dc',
		infoColorHover: '#5388ff',
		infoColorSuppl: '#4578ee',
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

export const api = createDiscreteApi(['notification'], { configProviderProps: { theme: darkTheme } });

import {
	NA,
	NAlert,
	NAvatar,
	NButton,
	NButtonGroup,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NDivider,
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
	NP,
	NPopconfirm,
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
	NA,
	NAlert,
	NAvatar,
	NButton,
	NButtonGroup,
	NCard,
	NCollapse,
	NCollapseItem,
	NCollapseTransition,
	NDivider,
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
	NP,
	NPopconfirm,
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
