import { cloneVNode, defineComponent, h, TransitionGroup, type VNode } from 'vue';

export default defineComponent({
	name: 'StaggeredTransitionGroup',
	props: {
		delay: {
			type: Number,
			default: 100
		},
		duration: {
			type: Number,
			required: false,
			default: undefined
		},
		appear: {
			type: Boolean,
			default: true
		}
	},
	setup(props, { slots, attrs }) {
		return () => {
			// (1) grab all slot children (flattened)
			const slotChildren = (slots.default?.() ?? [])[0]?.children as VNode[];
			if (!slotChildren) return null;
			// (2) clone each child with style
			const children = slotChildren.map((vnode, index) => {
				return cloneVNode(vnode, {
					style: {
						'transition-delay': `${(index + 1) * props.delay}ms`,
						...(props.duration ? { 'transition-duration': `${props.duration}ms` } : {}),
						...(vnode.props?.style ?? {})
					}
				});
			});

			// (3) Return TransitionGroup with children
			return h(
				TransitionGroup,
				{
					appear: props.appear,
					...attrs
				},
				() => children
			);
		};
	}
});
