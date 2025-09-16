precision highp float;

varying vec2 vTextureCoord;
varying vec2 vFilterCoord;
uniform sampler2D uSampler;
uniform float fade;
uniform float iTime;
uniform vec2 tokenSize;
uniform float seed;

float smoothFade() {
    return pow(fade, 0.8);
}

float scaleCeil(float x) {
    float g = 5.;
    return (x - 1.) * g + 1.;
}

float randv(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453 / seed);
}

float randvs(vec2 co) {
    return 2. * fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453 / seed) - 1.;
}

vec3 swirlColor(vec2 pos, float t) {
    float r = 0.7 + 0.7 * sin(2.0 + pos.x * 5.0 + t * 1.5);
    float g = 0.2 + 0.2 * sin(4.0 + pos.y * 5.0 + t * 1.7);
    float b = 0.7 + 0.7 * sin(pos.x * 5.0 + pos.y * 5.0 + t * 2.0);
    return vec3(r, g, r * 1.2);
}

float randf(float co) {
    return fract(sin(dot(vec2(co * 0.2739 * seed, co * -31.23 * seed), vec2(12.9898, 78.233))) * 43758.5453 / seed);
}

vec3 randColor(float ra) {
    float r = scaleCeil(randf(ra * 54.12));
    float g = scaleCeil(randf(ra * 12.34));
    float b = scaleCeil(randf(ra * 87.65));
    return vec3(r, g, b);
}

vec2 swoosh(float t, vec2 l) {
    float x = 1. - pow(t, l.x * 2. - 1.);
    float y = 1. - pow(t, l.y * 2. - 1.);
    return vec2(x, y);
}

float circleAlpha(vec2 uv, float radius) {
    float dist = 1. - min(1., length(uv) / radius);
    float smoothed = dist * 0.75;
    return smoothed;
}

void main() {
    vec4 baseColor = texture2D(uSampler, vTextureCoord);
    vec2 cuv = vFilterCoord * 2. - 1.;

    vec3 colors = vec3(0.);

    const int N = 5;
    for (int i = 1; i < N + 1; i++) {
        float fi = float(i);
        float x = randv(vec2(fi * 7.31, fi * 4.3473));
        float y = randv(vec2(fi * -2.57, fi * 3.12378));
        float radius = 1. + 0.33 * sin(iTime + fi * 4.3982);
        vec2 center = vec2(randvs(vec2(fi, 13.7)), randvs(vec2(fi, 47.3)));
        // Smooth entrance animation
        center *= 1. - smoothFade() + 1.;

        // Make them drift around slightly over time
        center += 0.2 * vec2(
                    sin(iTime * 3. + fi * 3.1 * seed),
                    cos(iTime * 3. + fi * 2.7 * seed)
                );
        vec2 muv = cuv + swoosh(smoothFade(), vec2(x, y)) * fi * 0.5;

        colors += swirlColor(cuv + center, iTime + (fi * randf(seed * fi))) * circleAlpha(cuv + center, radius);
    }

    // vec3 outColor = mix(baseColor.rgb, colors, smoothFade() * 0.33);
    vec3 outColor = baseColor.rgb + colors * smoothFade() * 0.5;
    gl_FragColor = vec4(outColor * baseColor.a, baseColor.a);
}
