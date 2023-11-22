#version 300 es
precision highp float;

uniform int u_style;

uniform sampler2D u_particle_texture;
uniform sampler2D u_colormap_texture;
uniform sampler2D u_velocity_texture;

uniform float u_colormap_start;
uniform float u_colormap_end;

uniform float u_u_offset;
uniform float u_u_scale;
uniform float u_v_offset;
uniform float u_v_scale;

in vec2 v_tex_coord;

out vec4 color;

float get_speed(vec2 pos) {
    vec2 velocity_raw = texture(u_velocity_texture, pos).xy;

    // r = g = 255 means we have no velocity, set it to zero in that case.
    if (velocity_raw.r == 1.0 && velocity_raw.g == 1.0) {
        return 0.0;
    }

    float u = velocity_raw.r * u_u_scale + u_u_offset;
    float v = velocity_raw.g * u_v_scale + u_v_offset;

    return sqrt(u*u + v*v);
}

void main() {
    // Get the speed at the current point (in physical units).
    float speed = get_speed(v_tex_coord);

    // Find the coordinate into the colormap texture for this speed.
    vec2 colormap_coords = vec2(0.0, 0.0);
    colormap_coords.s = clamp(
        (speed - u_colormap_start) / (u_colormap_end - u_colormap_start),
        0.0, 1.0
    );
    // Interpolate the colormap texture for this value.
    vec4 magnitude_color = texture(u_colormap_texture, colormap_coords);

    // Interpolate the particle texture at this point.
    vec4 particle_color = texture(u_particle_texture, v_tex_coord);

    // Blend the velocity magnitude texture with the particle texture.
    if (speed > 0.0) {
        if (u_style == 0) {
            // Render light particles on velocity magnitude.
            color = mix(
                magnitude_color,
                vec4(1.0, 1.0, 1.0, 1.0),
                particle_color.a
            );
        } else if (u_style == 1) {
            // Render dark particles on velocity magnitude.
            float factor = 1.0 - particle_color.a;
            color = magnitude_color;
            color.rgb *= factor * 0.8 + 0.2;
        } else if (u_style == 2) {
            // Render particles coloured by velocity magnitude on transparent
            // background.
            color = magnitude_color * particle_color.a;
            color.a = particle_color.a;
        } else {
            // Invalid style, just render transparent pixels.
            color = vec4(0.0, 0.0, 0.0, 0.0);
        }
    } else {
        color = vec4(0.0, 0.0, 0.0, 0.0);
    }
}
