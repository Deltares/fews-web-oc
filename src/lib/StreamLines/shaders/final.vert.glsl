#version 300 es

uniform float u_bbox_scale_x;
uniform float u_bbox_scale_y;
uniform float u_bbox_offset_x;
uniform float u_bbox_offset_y;

in vec4 a_position;
in vec2 a_tex_coord;

out vec2 v_tex_coord;

void main() {
    v_tex_coord = a_tex_coord;
    gl_Position = a_position;

    // Scale bounding box.
    gl_Position.x = gl_Position.x * u_bbox_scale_x + u_bbox_offset_x;
    gl_Position.y = gl_Position.y * u_bbox_scale_y + u_bbox_offset_y;
}
