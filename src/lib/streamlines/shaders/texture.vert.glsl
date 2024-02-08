#version 300 es

uniform float u_flip;

in vec4 a_position;
in vec2 a_tex_coord;

out vec2 v_tex_coord;

void main() {
    v_tex_coord = a_tex_coord;
    if (u_flip < 0.0) v_tex_coord.y = 1.0 - v_tex_coord.y;
    gl_Position = a_position;
}
