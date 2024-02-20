#version 300 es
precision highp float;

uniform sampler2D u_texture;
uniform float u_fade_amount;

in vec2 v_tex_coord;

out vec4 color;

void main() {
    color = texture(u_texture, v_tex_coord);
    color.a = max(color.a - u_fade_amount, 0.0);
}
