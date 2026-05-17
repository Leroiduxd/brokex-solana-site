/**
 * WebGL Shader Background Renderer for Brokex (Alternative setting: background.json)
 * Dynamically renders an animated GLSL shader background based on background.json
 * Supports smooth theme transitions between dark and light modes.
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Create and inject the Canvas element if it doesn't exist
    let canvas = document.getElementById('bg-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'bg-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '-1';
        canvas.style.pointerEvents = 'none';
        canvas.style.display = 'block';
        document.body.insertBefore(canvas, document.body.firstChild);
    }

    // 2. Initialize WebGL Context
    const gl = canvas.getContext('webgl', { alpha: false, antialias: true }) || 
               canvas.getContext('experimental-webgl', { alpha: false, antialias: true });

    if (!gl) {
        console.error('WebGL is not supported in this browser.');
        return;
    }

    // 3. Define the Shader Sources (Webpack-free, fully self-contained WebGL 1.0 compatible)
    const vertexShaderSource = `
        attribute vec4 a_position;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;
        void main() {
            gl_Position = a_position;
            v_tex_coord = a_tex_coord;
        }
    `;

    const fragmentShaderSource = `
        #ifdef GL_ES
        precision mediump float;
        #else
        precision highp float;
        #endif
        
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;
        uniform vec4 u_colors[2];
        uniform float u_intensity;
        uniform float u_rays;
        uniform float u_reach;

        #ifndef FNC_MOD289
        #define FNC_MOD289
        float mod289(const in float x) { return x - floor(x * (1. / 289.)) * 289.; }
        vec2 mod289(const in vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
        vec3 mod289(const in vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
        vec4 mod289(const in vec4 x) { return x - floor(x * (1. / 289.)) * 289.; }
        #endif

        #ifndef FNC_PERMUTE
        #define FNC_PERMUTE
        float permute(const in float x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec2 permute(const in vec2 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec3 permute(const in vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
        vec4 permute(const in vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
        #endif

        #ifndef FNC_TAYLORINVSQRT
        #define FNC_TAYLORINVSQRT
        float taylorInvSqrt(in float r) { return 1.79284291400159 - 0.85373472095314 * r; }
        vec2 taylorInvSqrt(in vec2 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        vec3 taylorInvSqrt(in vec3 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        vec4 taylorInvSqrt(in vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        #endif

        #ifndef FNC_QUINTIC
        #define FNC_QUINTIC 
        float quintic(const in float v) { return v*v*v*(v*(v*6.0-15.0)+10.0); }
        vec2  quintic(const in vec2 v)  { return v*v*v*(v*(v*6.0-15.0)+10.0); }
        vec3  quintic(const in vec3 v)  { return v*v*v*(v*(v*6.0-15.0)+10.0); }
        vec4  quintic(const in vec4 v)  { return v*v*v*(v*(v*6.0-15.0)+10.0); }
        #endif

        #ifndef FNC_PNOISE
        #define FNC_PNOISE
        float pnoise(in vec2 P, in vec2 rep) {
            vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
            vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
            Pi = mod(Pi, rep.xyxy); 
            Pi = mod289(Pi);        
            vec4 ix = Pi.xzxz;
            vec4 iy = Pi.yyww;
            vec4 fx = Pf.xzxz;
            vec4 fy = Pf.yyww;

            vec4 i = permute(permute(ix) + iy);

            vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0 ;
            vec4 gy = abs(gx) - 0.5 ;
            vec4 tx = floor(gx + 0.5);
            gx = gx - tx;

            vec2 g00 = vec2(gx.x,gy.x);
            vec2 g10 = vec2(gx.y,gy.y);
            vec2 g01 = vec2(gx.z,gy.z);
            vec2 g11 = vec2(gx.w,gy.w);

            vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
            g00 *= norm.x;
            g01 *= norm.y;
            g10 *= norm.z;
            g11 *= norm.w;

            float n00 = dot(g00, vec2(fx.x, fy.x));
            float n10 = dot(g10, vec2(fx.y, fy.y));
            float n01 = dot(g01, vec2(fx.z, fy.z));
            float n11 = dot(g11, vec2(fx.w, fy.w));

            vec2 fade_xy = quintic(Pf.xy);
            vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
            float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
            return 2.3 * n_xy;
        }
        #endif

        #ifndef SRGB_EPSILON 
        #define SRGB_EPSILON 0.00000001
        #endif

        #ifndef FNC_SRGB2RGB
        #define FNC_SRGB2RGB
        float srgb2rgb(float channel) {
            return (channel < 0.04045) ? channel * 0.0773993808 : pow((channel + 0.055) * 0.947867298578199, 2.4);
        }
        vec3 srgb2rgb(vec3 srgb) {
            return vec3(srgb2rgb(srgb.r + SRGB_EPSILON), 
                        srgb2rgb(srgb.g + SRGB_EPSILON),                 
                        srgb2rgb(srgb.b + SRGB_EPSILON));
        }
        vec4 srgb2rgb(vec4 srgb) {
            return vec4(srgb2rgb(srgb.rgb), srgb.a);
        }
        #endif

        #if !defined(FNC_SATURATE) && !defined(saturate)
        #define FNC_SATURATE
        #define saturate(x) clamp(x, 0.0, 1.0)
        #endif

        #ifndef FNC_RGB2SRGB
        #define FNC_RGB2SRGB
        float rgb2srgb(float channel) {
            return (channel < 0.0031308) ? channel * 12.92 : 1.055 * pow(channel, 0.4166666666666667) - 0.055;
        }
        vec3 rgb2srgb(vec3 rgb) {
            return saturate(vec3(rgb2srgb(rgb.r - SRGB_EPSILON), rgb2srgb(rgb.g - SRGB_EPSILON), rgb2srgb(rgb.b - SRGB_EPSILON)));
        }
        vec4 rgb2srgb(vec4 rgb) {
            return vec4(rgb2srgb(rgb.rgb), rgb.a);
        }
        #endif

        #ifndef FNC_MIXOKLAB
        #define FNC_MIXOKLAB
        vec3 mixOklab( vec3 colA, vec3 colB, float h ) {
            const mat3 kCONEtoLMS = mat3(                
                 0.4121656120,  0.2118591070,  0.0883097947,
                 0.5362752080,  0.6807189584,  0.2818474174,
                 0.0514575653,  0.1074065790,  0.6302613616);
            const mat3 kLMStoCONE = mat3(
                 4.0767245293, -1.2681437731, -0.0041119885,
                -3.3072168827,  2.6093323231, -0.7034763098,
                 0.2307590544, -0.3411344290,  1.7068625689);
            vec3 lmsA = pow( kCONEtoLMS * colA, vec3(1.0/3.0) );
            vec3 lmsB = pow( kCONEtoLMS * colB, vec3(1.0/3.0) );
            vec3 lms = mix( lmsA, lmsB, h );
            vec3 rgb = kLMStoCONE*(lms*lms*lms);
            return rgb;
        }
        vec4 mixOklab( vec4 colA, vec4 colB, float h ) {
            return vec4( mixOklab(colA.rgb, colB.rgb, h), mix(colA.a, colB.a, h) );
        }
        #endif

        float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord, float seedA, float seedB, float speed) {
            vec2 sourceToCoord = coord - raySource;
            float len = length(sourceToCoord);
            float cosAngle = dot(sourceToCoord / (len + 0.0001), rayRefDirection);
            return clamp(
                (.45 + 0.15 * sin(cosAngle * seedA + u_time * speed)) +
                (0.3 + 0.2 * cos(-cosAngle * seedB + u_time * speed)),
                u_reach, 1.0) *
                clamp((u_resolution.x - len) / u_resolution.x, u_reach, 1.0);
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            uv.y = 1.0 - uv.y;
            vec2 coord = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
            float speed = u_rays * 10.0;
            
            vec2 rayPos1 = vec2(u_resolution.x * 0.7, u_resolution.y * -0.4);
            vec2 rayRefDir1 = normalize(vec2(1.0, -0.116));
            float raySeedA1 = 36.2214*speed;
            float raySeedB1 = 21.11349*speed;
            float raySpeed1 = 1.5*speed;
            
            vec2 rayPos2 = vec2(u_resolution.x * 0.8, u_resolution.y * -0.6);
            vec2 rayRefDir2 = normalize(vec2(1.0, 0.241));
            float raySeedA2 = 22.39910*speed;
            float raySeedB2 = 18.0234*speed;
            float raySpeed2 = 1.1*speed;
            
            vec4 rays1 = vec4(0.,0.,0., .0) + rayStrength(rayPos1, rayRefDir1, coord, raySeedA1, raySeedB1, raySpeed1) * u_colors[0];
            vec4 rays2 = vec4(0.,0.,0., .0) + rayStrength(rayPos2, rayRefDir2, coord, raySeedA2, raySeedB2, raySpeed2) * u_colors[1];
            
            vec4 fragColor = (rays1) + (rays2);
            float brightness = 1.0*u_reach - (coord.y / u_resolution.y);
            fragColor *= (brightness + (0.5+ u_intensity));
            gl_FragColor = fragColor;
        }
    `;

    // 4. Helper function to compile shaders
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Compile and link program
    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('WebGL program linking error:', gl.getProgramInfoLog(program));
        return;
    }

    // 5. Setup Geometry (Full Screen Quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
    ]), gl.STATIC_DRAW);

    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // 6. Get Uniform Locations
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
    const colorsUniformLocation = gl.getUniformLocation(program, 'u_colors');
    const intensityUniformLocation = gl.getUniformLocation(program, 'u_intensity');
    const raysUniformLocation = gl.getUniformLocation(program, 'u_rays');
    const reachUniformLocation = gl.getUniformLocation(program, 'u_reach');

    // 7. Dynamic Uniform values from background.json (Subtly toned down for premium low-light aesthetics)
    const config = {
        intensity: 0.65,
        rays: 0.065,
        reach: 0.30
    };

    // Handle Interactive Tracking (Mouse + Touch)
    let mouse = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    let targetMouse = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };

    window.addEventListener('mousemove', (e) => {
        targetMouse.x = e.clientX;
        targetMouse.y = window.innerHeight - e.clientY; // Flip Y for WebGL coords
    });

    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            targetMouse.x = e.touches[0].clientX;
            targetMouse.y = window.innerHeight - e.touches[0].clientY;
        }
    }, { passive: true });

    // 8. Handle Dynamic Theme Colors & Easing
    // Smooth transition from dark (gold + black) to light (gold + cream)
    let currentColors = [
        [0.7843, 0.6627, 0.4941, 1], // Color 1 (Gold)
        [0.0, 0.0, 0.0, 1.0]          // Color 2 (Black)
    ];

    function getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }

    // 9. Resize Handling
    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
        }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 10. Frame Render Loop
    function render(time) {
        time *= 0.001; // Convert to seconds

        // Interpolate mouse smoothly for fluid visual effects
        mouse.x += (targetMouse.x - mouse.x) * 0.08;
        mouse.y += (targetMouse.y - mouse.y) * 0.08;

        // Fetch dynamic theme colors and interpolate smoothly
        const theme = getTheme();
        const isDark = theme === 'dark';

        // Targets:
        // Dark Mode: Rich Gold + Deep Charcoal/Black
        // Light Mode: Soft Deep Gold + Clean Light Alabaster Cream
        const targetColor1 = isDark ? [0.7843, 0.6627, 0.4941, 1.0] : [0.73, 0.60, 0.44, 1.0];
        const targetColor2 = isDark ? [0.03, 0.03, 0.03, 1.0]       : [0.98, 0.98, 0.96, 1.0];

        // Easing interpolation factor (8% per frame for smooth transitions)
        for (let i = 0; i < 4; i++) {
            currentColors[0][i] += (targetColor1[i] - currentColors[0][i]) * 0.06;
            currentColors[1][i] += (targetColor2[i] - currentColors[1][i]) * 0.06;
        }

        // Bind WebGL states
        gl.useProgram(program);

        // Bind uniform arrays
        gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);
        gl.uniform2f(mouseUniformLocation, mouse.x, mouse.y);
        gl.uniform1f(timeUniformLocation, time);
        
        // Colors flattened array
        const flattenedColors = new Float32Array([
            currentColors[0][0], currentColors[0][1], currentColors[0][2], currentColors[0][3],
            currentColors[1][0], currentColors[1][1], currentColors[1][2], currentColors[1][3]
        ]);
        gl.uniform4fv(colorsUniformLocation, flattenedColors);

        // Map intensities
        gl.uniform1f(intensityUniformLocation, isDark ? config.intensity : config.intensity * 0.7);
        gl.uniform1f(raysUniformLocation, config.rays);
        gl.uniform1f(reachUniformLocation, isDark ? config.reach : config.reach * 0.95);

        // Draw arrays
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Request next frame
        requestAnimationFrame(render);
    }

    // Start Render Loop
    requestAnimationFrame(render);
});
