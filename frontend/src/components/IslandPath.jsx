import React, { useEffect, useRef, useState } from "react";
import { ISLAND_IMAGES, getCharacterImage } from "../skins";
import { isSpecialSkin } from "../specialSkins";
import { useSettings } from "../contexts/SettingsContext";
import { playJump } from "../sound";

/**
 * Island-hopping path - purely a visualization of critical-path progress.
 *
 * BUG FIX (islands shifting on task ADD, not just on completion): the
 * previous version computed each island's vertical position as a fraction
 * of `totalIslands` ("climb evenly across the box, given how many islands
 * there are"). That meant adding a new task - which can change
 * totalIslands - silently moved EVERY existing island's position,
 * including the one the character was standing on, making it look like
 * the character jumped (sometimes backward) even though it hadn't
 * actually progressed. Position now depends ONLY on an island's own
 * index (a fixed sine wave), never on the total count - so appending a
 * new island can never move any existing one, and the character only
 * visibly moves when completedCritical itself changes.
 *
 * EQUIPPED OBJECT: rendered at the SAME size/position as the character,
 * directly overlaid - the art was deliberately drawn at matching
 * character proportions (not a small badge), so it must be composited at
 * that same scale to look right. Hidden entirely when a special skin is
 * equipped (see specialSkins.js) - those are already fully-designed
 * characters (e.g. a pirate already has a hat), so layering a generic
 * accessory on top would look wrong.
 *
 * AUTO-SCROLL: when the character's island changes, the scroll container
 * animates so the character stays in view.
 *
 * MIN_ISLANDS_SHOWN: a visual floor so the path always shows a multi-island
 * vista, even early in a project with few critical tasks.
 */

const MIN_ISLANDS_SHOWN = 8;

const ISLAND_SIZE = 112; // px, matches w-28
const CHARACTER_SIZE = 96; // px, matches w-24

const STEP_X = 130; // px between island centers - comfortably more than ISLAND_SIZE
const MARGIN_X = 90;
const WAVE_AMPLITUDE = 90; // px, how far up/down the path wanders
const WAVE_FREQUENCY = 0.8; // radians per island - purely a function of index, never of total count

function buildPositions(totalIslands, boxHeight) {
  const centerY = boxHeight / 2;
  return Array.from({ length: totalIslands }, (_, i) => ({
    x: MARGIN_X + i * STEP_X,
    y: centerY + WAVE_AMPLITUDE * Math.sin(i * WAVE_FREQUENCY),
  }));
}

export default function IslandPath({
  totalCritical,
  completedCritical,
  equippedCharacter,
  equippedRewardImage = null,
  height = 380,
}) {
  const totalIslands = Math.max(totalCritical + 1, MIN_ISLANDS_SHOWN);
  const currentIndex = Math.min(completedCritical, totalCritical);
  const characterImage = getCharacterImage(equippedCharacter);
  const showRewardOverlay = equippedRewardImage && !isSpecialSkin(equippedCharacter);
  const { t } = useSettings();

  const scrollRef = useRef(null);
  const [bouncing, setBouncing] = useState(false);
  const prevIndex = useRef(currentIndex);

  const positions = buildPositions(totalIslands, height);
  const charPos = positions[currentIndex];
  const containerWidth = MARGIN_X * 2 + STEP_X * (totalIslands - 1);

  useEffect(() => {
    if (currentIndex !== prevIndex.current) {
      setBouncing(true);
      playJump();
      const timer = setTimeout(() => setBouncing(false), 400);
      prevIndex.current = currentIndex;
      return () => clearTimeout(timer);
    }
  }, [currentIndex]);

  // Keep the character centered in the visible scroll area whenever its
  // position changes (new critical task completed, or a different
  // project loaded) - never on unrelated re-renders, since charPos now
  // only changes when currentIndex actually changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, charPos.x - el.clientWidth / 2);
    el.scrollTo({ left: target, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charPos.x]);

  return (
    <div
      ref={scrollRef}
      className="w-full rounded-xl p-4 relative overflow-x-auto overflow-y-hidden shadow-inner"
      style={{
        height,
        backgroundImage: "url(/water/water-tile.png)",
        backgroundRepeat: "repeat",
        backgroundSize: "64px 64px",
        imageRendering: "pixelated",
      }}
    >
      <div className="relative h-full" style={{ width: Math.max(containerWidth, 300), minWidth: "100%" }}>
        {positions.map((pos, i) => {
          const reached = i <= currentIndex;
          return (
            <div
              key={i}
              className="absolute"
              style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
            >
              <img
                src={ISLAND_IMAGES[i % ISLAND_IMAGES.length]}
                alt=""
                className="object-contain relative"
                style={{ width: ISLAND_SIZE, height: ISLAND_SIZE, opacity: reached ? 1 : 0.45 }}
              />
            </div>
          );
        })}

        <div
          className={"absolute transition-all duration-500 ease-out " + (bouncing ? "-translate-y-4" : "")}
          style={{ left: charPos.x, top: charPos.y, transform: "translate(-50%, -60%)" }}
        >
          <div className="relative" style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }}>
            <img
              src={characterImage}
              alt=""
              className="object-contain drop-shadow absolute inset-0"
              style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }}
            />
            {showRewardOverlay && (
              <img
                src={equippedRewardImage}
                alt=""
                title="Obiect echipat"
                className="object-contain absolute inset-0"
                style={{ width: CHARACTER_SIZE, height: CHARACTER_SIZE }}
              />
            )}
          </div>
        </div>
      </div>

      <p className="absolute bottom-2 left-4 text-xs text-white/90 whitespace-nowrap font-medium">
        {currentIndex}/{totalCritical} {t("islandsProgress")}
      </p>
    </div>
  );
}
