#version 300 es
precision highp float;

uniform sampler2D u_particle_texture;

in vec2 v_tex_coord;

out vec4 color;

void main() {
    color = texture(u_particle_texture, v_tex_coord);
}
