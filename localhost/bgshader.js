// Copyright (C) [2026] [Jonas Immanuel Frey] - Licensed under GPLv2. See LICENSE file for details.
let o_canvas = document.getElementById('background');
let o_gl = o_canvas.getContext('webgl');

let s_vert = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0, 1); }
`;

let s_frag = `
  precision mediump float;
  uniform vec2  u_res;
  uniform vec2  u_mouse;
  uniform float u_time;

  void main() {
    // the image is squished depending on the aspect ratio
    // so we need to use min x or y from the resolution

    vec2 uv = (gl_FragCoord.xy - u_res.xy * 0.5) / u_res.y;
    vec2 um = (u_mouse * u_res - u_res * 0.5) / u_res.y;

    float d1 = distance(uv, um);
    float bloom = 0.18 / (d1 * 3.5 + 0.18);
    bloom = clamp(bloom, 0.0, 1.0);
    bloom = pow(bloom, 1.6);

    float ox = sin(u_time * 0.19) * 0.25;
    float oy = cos(u_time * 0.13) * 0.18;
    float d2 = distance(uv, vec2(ox, oy));
    float ambient = 0.08 / (d2 * 4.0 + 0.25);
    ambient = clamp(ambient, 0.0, 1.0);

    float vig = 1.0 - smoothstep(0.4, 1.2, length(uv) * 2.0);

    vec3 col = vec3(0.04, 0.04, 0.06);
    col += bloom   * vec3(0.55, 0.50, 0.70) * 0.35;
    col += ambient * vec3(0.20, 0.35, 0.55) * 0.25;
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

let f_o_shader__compile = function(n_type, s_src) {
    let o_shader = o_gl.createShader(n_type);
    o_gl.shaderSource(o_shader, s_src);
    o_gl.compileShader(o_shader);
    return o_shader;
};

let o_prog = o_gl.createProgram();
o_gl.attachShader(o_prog, f_o_shader__compile(o_gl.VERTEX_SHADER,   s_vert));
o_gl.attachShader(o_prog, f_o_shader__compile(o_gl.FRAGMENT_SHADER, s_frag));
o_gl.linkProgram(o_prog);
o_gl.useProgram(o_prog);

let o_buf = o_gl.createBuffer();
o_gl.bindBuffer(o_gl.ARRAY_BUFFER, o_buf);
o_gl.bufferData(o_gl.ARRAY_BUFFER, new Float32Array([
    -1,-1,  1,-1,  -1, 1,
    -1, 1,  1,-1,   1, 1,
]), o_gl.STATIC_DRAW);

let n_loc__a_pos = o_gl.getAttribLocation(o_prog, 'a_pos');
o_gl.enableVertexAttribArray(n_loc__a_pos);
o_gl.vertexAttribPointer(n_loc__a_pos, 2, o_gl.FLOAT, false, 0, 0);

let o_ufloc__u_res   = o_gl.getUniformLocation(o_prog, 'u_res');
let o_ufloc__u_mouse = o_gl.getUniformLocation(o_prog, 'u_mouse');
let o_ufloc__u_time  = o_gl.getUniformLocation(o_prog, 'u_time');

let n_trn_x__mouse         = 0.5;
let n_trn_y__mouse         = 0.5;
let n_trn_x__mouse__target = 0.5;
let n_trn_y__mouse__target = 0.5;

window.addEventListener('mousemove', function(o_evt) {
    n_trn_x__mouse__target = o_evt.clientX / window.innerWidth;
    n_trn_y__mouse__target = 1.0 - o_evt.clientY / window.innerHeight;
});

let f_resize = function() {
    o_canvas.width  = window.innerWidth  * devicePixelRatio;
    o_canvas.height = window.innerHeight * devicePixelRatio;
    o_gl.viewport(0, 0, o_canvas.width, o_canvas.height);
};
window.addEventListener('resize', f_resize);
f_resize();

let n_ease = 0.04;

let f_loop = function(n_ms__timestamp) {
    let n_sec = n_ms__timestamp * 0.001;

    n_trn_x__mouse += (n_trn_x__mouse__target - n_trn_x__mouse) * n_ease;
    n_trn_y__mouse += (n_trn_y__mouse__target - n_trn_y__mouse) * n_ease;

    o_gl.uniform2f(o_ufloc__u_res,   o_canvas.width, o_canvas.height);
    o_gl.uniform2f(o_ufloc__u_mouse, n_trn_x__mouse, n_trn_y__mouse);
    o_gl.uniform1f(o_ufloc__u_time,  n_sec);
    o_gl.drawArrays(o_gl.TRIANGLES, 0, 6);
    requestAnimationFrame(f_loop);
};

let n_id__raf = 0;

let f_start = function() {
    n_id__raf = requestAnimationFrame(f_loop);
};

let f_stop = function() {
    n_id__raf = cancelAnimationFrame(n_id__raf);
};

export {
    f_start,
    f_stop,
    n_id__raf,
};
