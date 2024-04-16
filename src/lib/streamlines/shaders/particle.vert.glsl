#version 300 es
precision highp float;

uniform sampler2D u_velocity_texture;

uniform ivec2 u_canvas_size;
uniform float u_speed_factor;
uniform float u_speed_exponent;

uniform vec2 u_scale_in;
uniform vec2 u_offset_in;

uniform float u_dt;

uniform int u_index_eliminate_start;
uniform int u_index_eliminate_end;

in vec2 a_position;

out vec2 v_position;

// From: https://stackoverflow.com/questions/4200224/random-noise-functions-for-glsl
float gold_noise(vec2 pos, float seed){
    const float phi = 1.61803398874989484820459;
    return fract(tan(distance(pos * phi, pos) * seed) * pos.x);
}

vec2 random_position() {
    vec2 pos = a_position;
    float x = gold_noise(pos, -123.456) * 2.0 - 1.0;
    float y = gold_noise(pos, 789.012) * 2.0 - 1.0;
    return vec2(x, y);
}

vec2 get_clip_space_velocity(vec2 pos) {
    // Position is in clip space, but should be transformed to texture
    // coordinates.
    vec2 pos_texture = 0.5 * (pos + 1.0);

    vec2 velocity_raw = texture(u_velocity_texture, pos_texture).xy;

    // r = g = 255 means we have no velocity, set it to zero in that case.
    if (velocity_raw.r == 1.0 && velocity_raw.g == 1.0) {
        return vec2(0.0, 0.0);
    }

    // Compute velocity in physical coordinates.
    vec2 velocity = velocity_raw * u_scale_in + u_offset_in;

    // Apply speed exponent to "compress" the speed---for exponents smaller
    // than 1, higher speeds will be closer together.
    float speed_compressed = pow(length(velocity), u_speed_exponent);

    // Scale the speed by the speed factor so it is appropriately scaled for
    // particles moving in clip space.
    speed_compressed *= u_speed_factor;

    // Finally, compute the velocity based on the compressed speed.
    velocity = normalize(velocity) * speed_compressed;

    // Correct the velocity for the aspect ratio of the canvas.
    velocity.x *= float(u_canvas_size.y) / float(u_canvas_size.x);
    velocity.y *= -1.0;

    return velocity;
}

void main() {
    vec2 pos = a_position;
    if (gl_VertexID >= u_index_eliminate_start && gl_VertexID < u_index_eliminate_end) {
        // Randomly selected particles will be eliminated.
        v_position = random_position();
    } else if (pos.x < -1.0 || pos.x > 1.0 || pos.y < -1.0 || pos.y > 1.0) {
        // Also generate new positions if our particle leaves clip space.
        v_position = random_position();
    } else {
        vec2 velocity = get_clip_space_velocity(pos);
        v_position = pos + velocity * u_dt;
    }
}
