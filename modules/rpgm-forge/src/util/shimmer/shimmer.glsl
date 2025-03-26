precision mediump float;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;
uniform sampler2D uSampler; // The token's base texture
uniform float iTime; // Time in seconds (or any rate) — you must update this in JS
uniform vec2 tokenSize;
uniform float fade;
uniform float seed;

// A handy 2D random function using a "hash" approach
float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898 * seed, 78.233 * seed * 1.237))) * 43758.5453);
}

float smoothFade() {
    return pow(fade, 0.8);
}

// For smooth edges, a simple "soft circle" alpha function
// r is the distance from center, radius is how big the circle is
// returns how "opaque" the circle is at that distance
float circleAlpha(float r, float radius) {
    // Example: fuzzy fade-out near the radius
    float softness = 0.1;
    float cutoff = radius * (1.0 - softness);
    if (r > radius) return 0.0;
    if (r < cutoff) {
        // fully opaque near the center
        return 1.0;
    } else {
        // fade out in the ring [cutoff..radius]
        return 1.0 - smoothstep(cutoff, radius, r);
    }
}

// Generate a swirling color for a position & time
vec3 swirlColor(vec2 pos, float t) {
    // Example approach: a few sine waves to get color variation
    float r = 0.5 + 0.5 * sin(2.0 + pos.x * 5.0 + t * 1.5);
    float g = 0.5 + 0.5 * sin(4.0 + pos.y * 5.0 + t * 1.7);
    float b = 0.5 + 0.5 * sin(pos.x * 5.0 + pos.y * 5.0 + t * 2.0);
    return vec3(r, g, b);
}

// Main fragment
void main() {
    // Original token color
    vec4 baseColor = texture2D(uSampler, vTextureCoord);

    // If the token is fully transparent at this pixel, we’ll keep it that way.
    // This ensures we don’t draw shimmer outside the token silhouette.
    if (baseColor.a < 0.001) {
        gl_FragColor = baseColor;
        return;
    }

    // Convert vTextureCoord (0..1) into "pixel" space if needed
    // but we can just keep it 0..1 for this effect
    vec2 uv = vFilterCoord;

    // ---------------
    // 1) LARGE GRADIENT CIRCLES
    // ---------------
    vec3 gradients = vec3(0.0);
    float gradAlpha = 0.0;

    // We'll define N circles that drift around
    // (You can adjust for more or fewer circles for complexity/performance.)
    const int N = 9;
    for (int i = 0; i < N; i++) {
        // Pretend we have some stable "random" center for each circle i
        // using a built-in rand function.
        // We also animate the center over time.
        float fi = float(i);
        // base random center
        vec2 center = vec2(rand(vec2(fi, 13.7)), rand(vec2(fi, 47.3)));

        // Make them drift around slightly over time
        center += 0.2 * vec2(
                    sin(iTime * 2. + fi * 3.1),
                    cos(iTime * 2. + fi * 2.7)
                );

        // radius could also gently pulsate
        float radius = 0.4 + 0.15 * sin(iTime + fi * 1.2);

        // Distance from the current pixel to the circle center
        float dist = distance(uv, center);

        // The circle's alpha (fade at the edge)
        float cAlpha = circleAlpha(dist, radius);
        if (cAlpha > 0.0) {
            // color might swirl based on circle center plus time
            vec3 cColor = swirlColor((uv - center) * 2.0, iTime * 2.0 + fi * 0.5);
            // Accumulate color alpha-blended
            // Weighted by cAlpha, but you can also do more creative blending
            gradients = mix(gradients, cColor, cAlpha);
            gradAlpha = mix(gradAlpha, 1.0, cAlpha);
        }
    }

    vec3 shimmerRGB = gradients;
    float shimmerA = clamp(gradAlpha, 0.0, 1.0);

    // ---------------
    // FINAL BLENDING
    // ---------------
    // We want to overlay this shimmer where the base token is visible.
    // This means the effect’s final alpha is baseColor.a,
    // and the shimmer’s color is multiplied by baseColor.a
    // to ensure it doesn’t spill out of the token silhouette.
    float outAlpha = baseColor.a;
    vec3 outColor = mix(baseColor.rgb, shimmerRGB, smoothFade() * 0.25) * baseColor.a;

    gl_FragColor = vec4(outColor, outAlpha);
}
