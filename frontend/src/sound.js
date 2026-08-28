// Simple sound-effects player. Not using the Web Audio API on purpose -
// for short one-shot UI sounds, plain HTMLAudioElement instances are
// simpler and perfectly adequate; Web Audio would only pay off for
// precise timing/mixing, which this app doesn't need.

const sfx = { volume: 0.6, muted: false };

function playSfx(path) {
  if (sfx.muted) return;
  const audio = new Audio(path);
  audio.volume = sfx.volume;
  audio.play().catch(() => {}); // ignore autoplay-policy rejections
}

export function playClick() {
  playSfx("/sounds/click.mp3");
}

export function playJump() {
  playSfx("/sounds/jump.mp3");
}

export function playWinItem() {
  playSfx("/sounds/win-item.mp3");
}

export function playWinSkin() {
  playSfx("/sounds/win-skin.mp3");
}

export function setSfxVolume(v) {
  sfx.volume = v;
}

export function setSfxMuted(m) {
  sfx.muted = m;
}
