#version 300 es

uniform vec2 u_bbox_scale;
uniform vec2 u_bbox_offset;

in vec4 a_position;
in vec2 a_tex_coord;

out vec2 v_tex_coord;

void main() {
    v_tex_coord = a_tex_coord;
    gl_Position = a_position;

    // Scale bounding box.
    gl_Position.xy = gl_Position.xy * u_bbox_scale + u_bbox_offset;
}
