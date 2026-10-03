// GLSL for the X data core (doc 6.3). Five draw calls, one program each: halo, lines, points,
// packets, orbiters. Everything that moves is computed here from a handful of uniforms, so the CPU
// touches about a dozen numbers per frame and no buffer.
//
// Shared uniforms (one object, referenced by every material):
//   uK       0..4  the layout pair position (L0 X, L1 ARMS, L2 LINE, L3 FIELD, L4 MARK)
//   uMix     0..1  progress between layout floor(k) and floor(k) + 1 (aFrom, aTo hold that pair)
//   uAlpha         whole-object opacity, scroll driven
//   uActive, uPrev, uActiveMix   the lit arm, the one it replaced, and the 160 ms cross-fade
//   uDpr, uCamD    device pixel ratio and camera distance (z = 0 maps to CSS px)
// Colours are read from the page tokens at init; no colour literal lives here.

const COMMON = /* glsl */ `
uniform float uK;
uniform float uMix;
uniform float uAlpha;
uniform float uActive;
uniform float uPrev;
uniform float uActiveMix;
uniform float uDpr;
uniform float uCamD;
uniform vec3 uInk;
uniform vec3 uInk2;
uniform vec3 uInk3;
uniform vec3 uSignal;
uniform vec4 uGhost;
uniform vec4 uHair;

float litAmount(float arm) {
  float a = step(-0.5, arm);
  return a * (step(abs(arm - uActive), 0.5) * uActiveMix + step(abs(arm - uPrev), 0.5) * (1.0 - uActiveMix));
}

// Per point morph: outer points start later, so a change ripples out from the core.
float morph(float delay) {
  float m = clamp((uMix - delay * 0.35) / 0.65, 0.0, 1.0);
  return m * m * (3.0 - 2.0 * m);
}
`

// -- points: nodes as glyphs, the braid as dots ---------------------------------------------------

export const POINTS_VERT = /* glsl */ `
${COMMON}
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aDelay;
attribute float aKind;
attribute float aEvidence;
attribute float aArm;
attribute float aTone;
attribute float aSeed;
varying vec4 vColor;
varying float vKind;
varying float vShape;
varying float vEvidence;
varying float vHalf;
varying float vPx;

void main() {
  vec3 p = mix(aFrom, aTo, morph(aDelay));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float mark = smoothstep(3.0, 4.0, uK);
  // Nodes are glyphs in the X and the arms, collapse to dust on the line, return small in the field.
  float shapeA = 1.0 - smoothstep(1.0, 2.0, uK);
  float shapeB = smoothstep(2.0, 3.0, uK) * (1.0 - smoothstep(3.2, 4.0, uK)) * 0.8;
  float shape = max(shapeA, shapeB);

  float size = 1.5 + 0.7 * aSeed; // structural dot, css px
  vec3 col = uInk3;
  float a = 0.6;
  float glyph = 0.0;

  // On the line the six stops and the packet are DOM (WP4's, the information); WebGL keeps only
  // the dust, so the core and the stop glyphs step aside there.
  float onLine = smoothstep(1.3, 1.9, uK) * (1.0 - smoothstep(2.1, 2.6, uK));
  a = 0.6 * (1.0 - 0.35 * onLine);

  if (aKind > 0.5 && aKind < 1.5) { // core: the yellow diamond
    size = mix(11.0, 6.0, mark) * (1.0 - onLine);
    col = uSignal;
    a = 1.0;
    glyph = 1.0 - mark;
  } else if (aKind > 1.5 && aKind < 2.5) { // hub
    size = mix(3.0, 11.0, shape);
    col = uInk2;
    a = 0.95;
    glyph = shape;
  } else if (aKind > 2.5 && aKind < 3.5) { // service
    size = mix(3.0, 7.0, shape);
    col = uInk2;
    a = 0.95;
    glyph = 1.0;
  } else if (aKind > 3.5 && aKind < 4.5) { // leaf
    size = mix(2.2, 4.0, shape);
    a = 0.9;
    glyph = 1.0;
  } else if (aKind > 4.5 && aKind < 5.5) { // record
    size = mix(3.0, 9.0, shape);
    col = uInk2;
    a = 0.95;
    glyph = shape;
  } else if (aKind > 5.5 && aKind < 6.5) { // pending status
    size = mix(3.0, 8.0, shape);
    a = 0.95;
    glyph = shape;
  } else if (aKind > 6.5) { // method step: parked on the core, then dust in the field and the mark
    size = step(2.5, uK) * 2.4;
    col = uInk2;
    a = 0.9;
  }

  // The lit arm: its hub, services and braid turn yellow (doc 4.4).
  float lit = litAmount(aArm) * step(aKind, 4.5); // not records or satellites: they stay evidence glyphs
  col = mix(col, uSignal, lit);
  a = mix(a, max(a, 0.95), lit);

  // The mark: every point takes the tone of the stroke it lands on.
  vec3 tone = mix(uInk, uSignal, aTone);
  col = mix(col, tone, mark * (1.0 - step(0.5, aKind) * step(aKind, 1.5)));
  a = mix(a, 0.95, mark);
  // On the mark the dots grow until the 1,200 of them read as a solid, crisp shape.
  size = mix(size, 3.0 + 1.4 * aSeed, mark * (1.0 - step(0.5, aKind) * step(aKind, 1.5)));

  vColor = vec4(col, a * uAlpha);
  vKind = aKind;
  vShape = glyph;
  vEvidence = aEvidence;
  vHalf = size * 0.5;
  vPx = size + 2.0;
  gl_PointSize = vPx * uDpr * uCamD / max(1.0, -mv.z);
  // A point with no size is moved off the clip volume rather than drawn as a speck.
  if (size < 0.2) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`

export const POINTS_FRAG = /* glsl */ `
varying vec4 vColor;
varying float vKind;
varying float vShape;
varying float vEvidence;
varying float vHalf;
varying float vPx;

float sdBox(vec2 p, float h) {
  vec2 d = abs(p) - vec2(h);
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float ring(float sd) { return abs(sd) - 0.5; }

void main() {
  vec2 q = (gl_PointCoord - 0.5) * vPx;
  float d = length(q) - vHalf; // default: a filled disc
  float hatch = 0.0;
  float k = vKind;

  if (vShape > 0.5) {
    if (k > 0.5 && k < 1.5) { // core: a filled square turned 45 degrees
      vec2 r = vec2(q.x + q.y, q.y - q.x) * 0.70710678;
      d = sdBox(r, vHalf * 0.72);
    } else if (k > 1.5 && k < 2.5) { // hub: 1 px outlined square
      d = ring(sdBox(q, vHalf - 0.5));
    } else if (k > 4.5 && k < 5.5) { // record: outlined square, cross tick, or hatch if illustrative
      float sd = sdBox(q, vHalf - 0.5);
      d = ring(sd);
      if (vEvidence > 1.5) {
        hatch = (1.0 - step(0.0, sd)) * step(mod(q.x + q.y + 100.0, 4.5), 1.0) * 0.7;
      } else {
        float cross = min(abs(q.x), abs(q.y));
        float arm = max(abs(q.x), abs(q.y));
        hatch = (1.0 - step(0.6, cross)) * (1.0 - step(vHalf * 0.5, arm)) * 0.9;
      }
    } else if (k > 5.5 && k < 6.5) { // pending status: a dashed hollow ring
      float ang = atan(q.y, q.x);
      d = ring(length(q) - (vHalf - 0.5));
      d += step(0.5, fract(ang * 1.2732395)) * 2.0; // gaps: dashes of a quarter turn over eight
    } else if (k > 6.5) { // method stop: outlined square
      d = ring(sdBox(q, vHalf - 0.5));
    }
  }

  float cov = 1.0 - smoothstep(-0.5, 0.5, d);
  cov = max(cov, hatch);
  float alpha = cov * vColor.a;
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb, alpha);
}
`

// -- lines: ghost edges and the braid strands ------------------------------------------------------

export const LINES_VERT = /* glsl */ `
${COMMON}
attribute vec3 aFrom;
attribute vec3 aTo;
attribute float aDelay;
attribute float aKindE;
attribute float aArm;
attribute float aT;
varying vec4 vColor;
varying float vT;
varying float vDash;

void main() {
  vec3 p = mix(aFrom, aTo, morph(aDelay));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);

  // The method chain is the line itself, which is DOM; WebGL draws only the arm edges.
  float method = step(3.5, aKindE);
  float wArms = 1.0 - smoothstep(1.1, 1.9, uK);
  float vis = wArms * (1.0 - method);

  vec4 base = uGhost; // member and record edges
  if (aKindE < 0.5) base = uHair; // braid strands
  else if (aKindE > 2.5) base = uHair; // pending and method
  float lit = litAmount(aArm) * (1.0 - method);
  vec3 col = mix(base.rgb, uSignal, lit);
  float a = mix(base.a, aKindE < 0.5 ? 0.9 : 0.6, lit);
  vColor = vec4(col, a * vis * uAlpha);
  vT = aT;
  vDash = step(2.5, aKindE) * (1.0 - method); // pending edges are dashed
}
`

export const LINES_FRAG = /* glsl */ `
varying vec4 vColor;
varying float vT;
varying float vDash;

void main() {
  if (vDash > 0.5 && fract(vT * 8.0) > 0.5) discard;
  if (vColor.a < 0.004) discard;
  gl_FragColor = vColor;
}
`

// -- packets: instanced dashes riding a quadratic through each edge --------------------------------

export const PACKETS_VERT = /* glsl */ `
${COMMON}
attribute vec3 aA0;
attribute vec3 aAc;
attribute vec3 aA1;
attribute vec3 aB0;
attribute vec3 aBc;
attribute vec3 aB1;
attribute float aPhase;
attribute float aArm;
attribute float aIdx;
uniform float uClock;
varying vec4 vColor;

vec3 bez(vec3 p0, vec3 c, vec3 p1, float t) {
  float u = 1.0 - t;
  return u * u * p0 + 2.0 * u * t * c + t * t * p1;
}
vec3 dbez(vec3 p0, vec3 c, vec3 p1, float t) {
  return 2.0 * (1.0 - t) * (c - p0) + 2.0 * t * (p1 - c);
}

void main() {
  float t = fract(uClock + aPhase);
  float m = smoothstep(0.0, 1.0, uMix);
  vec3 p = mix(bez(aA0, aAc, aA1, t), bez(aB0, aBc, aB1, t), m);
  vec3 d = mix(dbez(aA0, aAc, aA1, t), dbez(aB0, aBc, aB1, t), m);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec2 dir = (modelViewMatrix * vec4(d, 0.0)).xy;
  dir = length(dir) > 1e-5 ? normalize(dir) : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  // The dash is 9 x 2.2 css px: offsets are added in view space, where one unit is one css px.
  mv.xy += dir * position.x * 9.0 + nrm * position.y * 2.2;
  gl_Position = projectionMatrix * mv;

  float ends = smoothstep(0.0, 0.08, t) * (1.0 - smoothstep(0.9, 1.0, t));
  // The hero idles with a few packets; the arms layout opens the rest (doc 6.1: up to 24).
  float shown = 1.0 - step(mix(6.0, 24.0, smoothstep(0.8, 1.3, uK)), aIdx);
  float vis = (1.0 - smoothstep(1.1, 1.8, uK)) * shown;
  float lit = litAmount(aArm);
  float someLit = step(-0.5, uActive);
  // With an arm lit, only its packets stay yellow; the rest dim.
  vec3 col = mix(uSignal, uInk2, someLit * (1.0 - lit));
  float a = mix(1.0, 0.4, someLit * (1.0 - lit));
  vColor = vec4(col, a * ends * vis * uAlpha);
}
`

export const PACKETS_FRAG = /* glsl */ `
varying vec4 vColor;
void main() {
  if (vColor.a < 0.01) discard;
  gl_FragColor = vColor;
}
`

// -- orbiters: 16 dots on two implied ellipses around the core ---------------------------------------

export const ORBITERS_VERT = /* glsl */ `
${COMMON}
attribute float aPhase;
attribute float aRx;
attribute float aRy;
attribute float aTilt;
attribute float aSpeed;
uniform float uTime;
uniform vec3 uCoreA;
uniform vec3 uCoreB;
varying vec4 vColor;

void main() {
  float ang = aPhase + uTime * aSpeed;
  vec2 e = vec2(cos(ang) * aRx, sin(ang) * aRy);
  float c = cos(aTilt);
  float s = sin(aTilt);
  vec2 r = vec2(e.x * c - e.y * s, e.x * s + e.y * c);
  vec3 p = mix(uCoreA, uCoreB, smoothstep(0.0, 1.0, uMix)) + vec3(r, sin(ang) * 0.02);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 4.4 * uDpr * uCamD / max(1.0, -mv.z);
  float vis = 1.0 - smoothstep(0.8, 1.4, uK);
  vColor = vec4(uInk2, 0.7 * vis * uAlpha);
}
`

export const ORBITERS_FRAG = /* glsl */ `
varying vec4 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float cov = 1.0 - smoothstep(0.45, 0.6, r);
  float a = cov * vColor.a;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor.rgb, a);
}
`

// -- halo: one soft sprite behind the core, at most 0.15 alpha -------------------------------------------

export const HALO_VERT = /* glsl */ `
${COMMON}
uniform vec3 uCoreA;
uniform vec3 uCoreB;
varying float vVis;

void main() {
  vec3 p = mix(uCoreA, uCoreB, smoothstep(0.0, 1.0, uMix));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 160.0 * uDpr * uCamD / max(1.0, -mv.z);
  vVis = (1.0 - smoothstep(0.8, 1.6, uK)) * uAlpha;
}
`

export const HALO_FRAG = /* glsl */ `
uniform vec3 uSignal;
varying float vVis;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = 0.15 * pow(max(1.0 - r, 0.0), 2.2) * vVis;
  if (a < 0.002) discard;
  gl_FragColor = vec4(uSignal, a);
}
`
