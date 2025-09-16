import { useThemeVars } from 'naive-ui';
import type { ImgHTMLAttributes } from 'vue';

import d20Icon from '##/assets/d20-512x512.webp';
import d20Checked from '##/assets/d20-checked.webp?url';
import d20Warning from '##/assets/d20-warning.webp?url';

export default defineComponent({
	name: 'DiceIcon',
	props: {} as ImgHTMLAttributes & {
		type: 'rpgm' | 'success' | 'warning' | 'error' | 'offline',
		shadow: boolean
	},
	setup(props) {
		const theme = useThemeVars();

		let icon = d20Icon;
		let shadowColor = theme.value.primaryColor;
		switch (props.type) {
			case 'success':
				icon = d20Checked;
				shadowColor = theme.value.successColor;
				break;
			case 'warning':
				icon = d20Warning;
				shadowColor = theme.value.warningColor;
				break;
			case 'error':
				icon = d20Warning;
				shadowColor = theme.value.errorColor;
				break;
		}

		return () => h('img', {
			...props,
			src: icon,
			style: {
				...props.style,
				filter: props.shadow ? `drop-shadow(0 0 4px ${shadowColor})` : 'none'
			}
		});
	}
});
