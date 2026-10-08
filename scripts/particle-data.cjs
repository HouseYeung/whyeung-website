// A deterministic spherical point cloud; shared by WebGL and the static fallback.
function createParticleData(count, seed = 708, radius = 2.6) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const brightness = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let index = 0; index < count; index++) {
    const y = 1 - 2 * (index + 0.5) / count;
    const ring = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index + (random() - 0.5) * 0.16;
    const shell = radius * (0.99 + random() * 0.02);
    positions[index * 3] = Math.cos(angle) * ring * shell;
    positions[index * 3 + 1] = y * shell;
    positions[index * 3 + 2] = Math.sin(angle) * ring * shell;
    sizes[index] = 1.5 + random() * 1.8;
    brightness[index] = 0.55 + random() * 0.45;
  }
  return { positions, sizes, brightness };
}

function choosePointCount(width, coarsePointer) {
  return width < 640 || coarsePointer ? 2000 : 4600;
}

function canAnimate({ visible, hidden, reduced, paused, contextLost }) {
  return visible && !hidden && !reduced && !paused && !contextLost;
}

module.exports = { createParticleData, choosePointCount, canAnimate };
