import frag from './shimmer2.glsl?raw'
import vertex from './vertex.glsl?raw'

export function shimmer(token: Token): Shimmer {
	return new ShimmerFilter(token)
}

export interface Shimmer {
	fadeIn(duration: number): Promise<void>
	fadeOut(duration: number): Promise<void>
}

class ShimmerFilter extends PIXI.Filter implements Shimmer {
	token: Token
	startTime: number
	fadingOut: boolean

	constructor(token: Token) {
		super(vertex, frag, {
			iTime: 0,
			fade: 0,
			seed: 1 + Math.random(),
			tokenSize: [token.w, token.h],
		})
		this.fadingOut = false
		this.token = token
		this.token.draw().then(t => {
			if (t.mesh.filters)
				t.mesh.filters.push(this)
			else
				t.mesh.filters = [this]
			canvas.app?.ticker.add(this.updateFn, this)
		})
		this.startTime = performance.now()
	}

	updateFn() {
		let elapsed = (performance.now() - this.startTime) / 1000
		this.uniforms.iTime = elapsed
	}

	async fadeIn(duration: number = 1000): Promise<void> {
		return new Promise((resolve) => {
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
		this.fadingOut = true
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
					const i = this.token.mesh.filters?.indexOf(this) ?? -1
					this.token.mesh.filters?.splice(i, 1)
					resolve();
				}
			};
			canvas.app?.ticker.add(animate, this);
		});
	}
}
