#version 300 es

in vec2 a_position;
in vec2 a_tex_coord;

uniform float u_step_x;
uniform float u_step_y;
uniform int u_width;
uniform sampler2D u_particle_position_texture;

uniform float u_particle_size;
uniform float u_aspect_ratio;

out vec2 v_tex_coord;

void main() {
    // Scale quad and correct for aspect ratio.
    vec2 position = a_position * u_particle_size;
    position.y *= u_aspect_ratio;

    // Obtain particle position from texture by computing the appropriate
    // texture x, y-coordinates from the current particle index.
    int iy = gl_InstanceID / u_width;
    int ix = gl_InstanceID - iy * u_width;
    vec2 tex_coord = vec2(
        0.5 * u_step_x + float(ix) * u_step_x,
        0.5 * u_step_y + float(iy) * u_step_y
    );
    vec4 particle_position = texture(u_particle_position_texture, tex_coord);

    gl_Position = vec4(
        position + particle_position.xy,
        0.0, 1.0
    );
    v_tex_coord = a_tex_coord;
}
