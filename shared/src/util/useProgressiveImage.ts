export function useProgressiveImage(placeholder: string, url: string) {
	const src = ref(placeholder);
	const blur = ref(true);

	const image = new Image();
	image.src = url;

	image.onload = () => {
		src.value = url;
		blur.value = false;
	};

	return {
		src,
		blur
	};
}
