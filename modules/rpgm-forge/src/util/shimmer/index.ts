import fragURL from './shimmer2.glsl?url';
import vertexURL from './vertex.glsl?url';

/**
 * Prepare a shimmer effect for a token
 * @param token - The token to shimmer
 * @returns A unique shimmer object for this token
 */
export async function shimmerToken(token: Token): Promise<Shimmer> {
	/** Ensure only one shimmer filter per token */
	await ShimmerFilter.setShader();
	return ShimmerFilter.shimmering.get(token) ??
		new ShimmerFilter(token);
}

/**
 * An object for starting and stopping a shimmer effect
 */
interface Shimmer {
	fadeIn(duration: number): Promise<void>
	fadeOut(duration: number): Promise<void>
}

/**
 * The Shimmer filter implementation
 */
class ShimmerFilter extends PIXI.Filter implements Shimmer {
	static shimmering: WeakMap<Token, ShimmerFilter> = new WeakMap();
	static frag?: string;
	static vertex?: string;
	token: Token;
	startTime: number;
	active: boolean = false;
	fadingOut: boolean;

	/** Fetch the shader code once */
	static async setShader(): Promise<void> {
		await fetch(vertexURL).then(async (v) => {
			if (v.ok) ShimmerFilter.vertex ??= await v.text();
			else rpgm.logger.error("Failed to grab shimmer shaders");
		});
		await fetch(fragURL).then(async (v) => {
			if (v.ok) ShimmerFilter.frag ??= await v.text();
			else rpgm.logger.error("Failed to grab shimmer shaders");
		});
	}

	constructor(token: Token) {
		super(ShimmerFilter.vertex, ShimmerFilter.frag, {
			iTime: 0,
			fade: 0,
			seed: 1 + Math.random(),
			tokenSize: [token.w, token.h],
		});
		this.fadingOut = false;
		this.token = token;
		this.token.draw().then(t => {
			if (!t.mesh) return;
			if (t.mesh.filters)
				t.mesh.filters.push(this);
			else
				t.mesh.filters = [this];
			ShimmerFilter.shimmering.set(token, this);
			canvas.app?.ticker.add(() => this.updateFn(), this);
		}).catch(() => { });
		this.startTime = performance.now();
	}

	/** Update shader uniforms */
	updateFn() {
		const elapsed = (performance.now() - this.startTime) / 1000;
		this.uniforms.iTime = elapsed;
	}

	/**
	 * @param duration - How long to fade in for
	 * @returns A promise that resolves when the fade animation has completed
	 */
	async fadeIn(duration: number = 1000): Promise<void> {
		if (this.active) return;
		return new Promise((resolve) => {
			this.active = true;
			const start = performance.now();
			const animate = () => {
				const now = performance.now();
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				this.uniforms.fade = progress;
				if (progress >= 1 || this.fadingOut) {
					canvas.app?.ticker.remove(animate, this);
					resolve();
				}
			};
			canvas.app?.ticker.add(animate, this);
		});
	}

	/**
	 * @param duration - How long to fade out for
	 * @returns A promise that resolves when the fade animation has completed
	 */
	async fadeOut(duration: number = 1000): Promise<void> {
		if (!this.active) return;
		this.fadingOut = true;
		return new Promise((resolve) => {
			const start = performance.now();
			const animate = () => {
				const now = performance.now();
				const elapsed = now - start;
				const progress = Math.min(elapsed / duration, 1);
				// For fade-out, we invert the progress.
				this.uniforms.fade = 1 - progress;
				if (progress >= 1) {
					canvas.app?.ticker.remove(animate, this);
					const i = this.token.mesh?.filters?.indexOf(this) ?? -1;
					this.token.mesh?.filters?.splice(i, 1);
					ShimmerFilter.shimmering.delete(this.token);
					resolve();
				}
			};
			canvas.app?.ticker.add(animate, this);
		});
	}
}
