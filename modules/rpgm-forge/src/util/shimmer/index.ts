import frag from './shimmer2.glsl?raw';
import vertex from './vertex.glsl?raw';

export function shimmerToken(token: Token): Shimmer {
	/** Ensure only one shimmer filter per token */
	return ShimmerFilter.shimmering.get(token) ??
		new ShimmerFilter(token);
}

interface Shimmer {
	fadeIn(duration: number): Promise<void>
	fadeOut(duration: number): Promise<void>
}

class ShimmerFilter extends PIXI.Filter implements Shimmer {
	static shimmering: WeakMap<Token, ShimmerFilter> = new WeakMap();
	token: Token;
	startTime: number;
	active: boolean = false;
	fadingOut: boolean;

	constructor(token: Token) {
		super(vertex, frag, {
			iTime: 0,
			fade: 0,
			seed: 1 + Math.random(),
			tokenSize: [token.w, token.h],
		});
		this.fadingOut = false;
		this.token = token;
		this.token.draw().then(t => {
			if (t.mesh.filters)
				t.mesh.filters.push(this);
			else
				t.mesh.filters = [this];
			ShimmerFilter.shimmering.set(token, this);
			canvas.app?.ticker.add(() => this.updateFn(), this);
		}).catch(() => { });
		this.startTime = performance.now();
	}

	updateFn() {
		const elapsed = (performance.now() - this.startTime) / 1000;
		this.uniforms.iTime = elapsed;
	}

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
					const i = this.token.mesh.filters?.indexOf(this) ?? -1;
					this.token.mesh.filters?.splice(i, 1);
					ShimmerFilter.shimmering.delete(this.token);
					resolve();
				}
			};
			canvas.app?.ticker.add(animate, this);
		});
	}
}
