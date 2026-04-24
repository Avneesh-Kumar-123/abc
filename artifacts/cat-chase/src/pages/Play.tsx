import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Play as PlayIcon, RotateCcw, ChevronRight, Home, X, Settings as SettingsIcon } from "lucide-react";
import { GameCanvas } from "@/components/GameCanvas";
import { HUD } from "@/components/HUD";
import { VirtualJoystick } from "@/components/VirtualJoystick";
import { Modal } from "@/components/Modal";
import { StarRating } from "@/components/StarRating";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/levels";
import { sfx, setAudioMuted } from "@/game/audio";
import { recordLevelComplete, updateSettings } from "@/game/storage";
import type { PowerUpKind, SaveData } from "@/game/types";

type Props = {
  levelId: number;
  save: SaveData;
  onSave: (s: SaveData) => void;
};

type Outcome = null | { kind: "win"; stars: number; timeRemaining: number; score: number } | { kind: "lose"; reason: "time" | "trap"; score: number };

const difficultyMul = (d: SaveData["settings"]["difficulty"]) =>
  d === "easy" ? 0.85 : d === "hard" ? 1.18 : 1;

const computeStars = (timeRemaining: number, totalTime: number) => {
  const pct = timeRemaining / totalTime;
  if (pct >= 0.6) return 3;
  if (pct >= 0.3) return 2;
  return 1;
};

export const Play = ({ levelId, save, onSave }: Props) => {
  const [, setLoc] = useLocation();
  const level = useMemo(() => LEVELS.find((l) => l.id === levelId) ?? LEVELS[0]!, [levelId]);
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [joy, setJoy] = useState({ x: 0, y: 0 });
  const [hud, setHud] = useState<{
    score: number;
    timeLeft: number;
    activePower: { kind: PowerUpKind; until: number } | null;
    now: number;
    miceLeft: number;
    miceTotal: number;
    combo: number;
  }>({
    score: 0,
    timeLeft: level.time,
    activePower: null,
    now: performance.now(),
    miceLeft: level.mouseCount ?? 1,
    miceTotal: level.mouseCount ?? 1,
    combo: 0,
  });

  // sync mute flag with settings
  useEffect(() => {
    setAudioMuted(!save.settings.sound);
  }, [save.settings.sound]);

  const handleCatch = useCallback(
    (timeRemaining: number, score: number) => {
      const stars = computeStars(timeRemaining, level.time);
      sfx.win();
      const updated = recordLevelComplete(save, level.id, stars, timeRemaining);
      onSave(updated);
      setOutcome({ kind: "win", stars, timeRemaining, score });
    },
    [level, save, onSave],
  );

  const handleTimeUp = useCallback((score: number) => {
    setOutcome({ kind: "lose", reason: "time", score });
  }, []);

  const handleTrap = useCallback(() => {
    setOutcome({ kind: "lose", reason: "trap", score: 0 });
  }, []);

  const restart = () => {
    sfx.click();
    setOutcome(null);
    setPaused(false);
    // remount canvas via key change
    setKey((k) => k + 1);
  };

  const nextLevel = useMemo(
    () => LEVELS.find((l) => l.id === level.id + 1),
    [level.id],
  );

  const canPlayNext = !!nextLevel && save.highestUnlocked >= (nextLevel?.id ?? Infinity);

  const next = () => {
    sfx.click();
    if (nextLevel) {
      setOutcome(null);
      setPaused(false);
      setLoc(`/play/${nextLevel.id}`);
    } else {
      setLoc("/levels");
    }
  };

  const [key, setKey] = useState(0);

  const toggleSound = () => {
    sfx.click();
    onSave(updateSettings(save, { sound: !save.settings.sound }));
  };

  return (
    <div
      className="relative h-screen w-full overflow-hidden"
      style={{ background: level.theme.bgGradient[1] }}
    >
      <GameCanvas
        key={key}
        level={level}
        difficultyMul={difficultyMul(save.settings.difficulty)}
        paused={paused || outcome !== null}
        joystick={joy}
        onCatch={handleCatch}
        onTimeUp={handleTimeUp}
        onTrap={handleTrap}
        onState={setHud}
      />

      <HUD
        level={level.id}
        levelName={level.name}
        score={hud.score}
        timeLeft={hud.timeLeft}
        totalTime={level.time}
        activePower={hud.activePower}
        now={hud.now}
        miceLeft={hud.miceLeft}
        miceTotal={hud.miceTotal}
        combo={hud.combo}
        sound={save.settings.sound}
        onPause={() => {
          sfx.click();
          setPaused(true);
        }}
        onToggleSound={toggleSound}
      />

      <VirtualJoystick onChange={(x, y) => setJoy({ x, y })} />

      {/* Hint banner — only shows briefly */}
      <HintBanner hint={level.hint} levelId={level.id} />

      {/* Pause modal */}
      <Modal open={paused && !outcome && !settingsOpen}>
        <div className="p-6 text-center">
          <h2 className="font-display text-3xl font-bold mb-1">Paused</h2>
          <p className="text-muted-foreground mb-5">Take a breath, then go catch that mouse.</p>
          <div className="grid gap-2">
            <Button
              size="lg"
              className="font-display font-bold"
              onClick={() => {
                sfx.click();
                setPaused(false);
              }}
              data-testid="button-resume"
            >
              <PlayIcon className="mr-2 h-5 w-5 fill-current" /> Resume
            </Button>
            {nextLevel && (
              <Button
                variant="secondary"
                className="font-display font-bold"
                onClick={next}
                disabled={!canPlayNext}
                data-testid="button-next-level"
                title={canPlayNext ? undefined : "Complete this level to unlock"}
              >
                <ChevronRight className="mr-2 h-4 w-4" /> Next Level
              </Button>
            )}
            <Button
              variant="secondary"
              className="font-display font-bold"
              onClick={restart}
              data-testid="button-restart"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Restart Level
            </Button>
            <Button
              variant="secondary"
              className="font-display font-bold"
              onClick={() => {
                sfx.click();
                setSettingsOpen(true);
              }}
              data-testid="button-settings"
            >
              <SettingsIcon className="mr-2 h-4 w-4" /> Settings
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full font-display font-bold" data-testid="button-quit">
                <Home className="mr-2 h-4 w-4" /> Quit to Menu
              </Button>
            </Link>
          </div>
        </div>
      </Modal>

      {/* Settings panel (accessible from pause) */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        save={save}
        onSave={onSave}
      />

      {/* Win modal */}
      <Modal open={outcome?.kind === "win"}>
        {outcome?.kind === "win" && (
          <WinPanel outcome={outcome} levelId={level.id} onRestart={restart} onNext={next} />
        )}
      </Modal>

      {/* Lose modal */}
      <Modal open={outcome?.kind === "lose"}>
        {outcome?.kind === "lose" && (
          <LosePanel reason={outcome.reason} onRestart={restart} />
        )}
      </Modal>
    </div>
  );
};

const WinPanel = ({
  outcome,
  levelId,
  onRestart,
  onNext,
}: {
  outcome: { stars: number; timeRemaining: number; score: number };
  levelId: number;
  onRestart: () => void;
  onNext: () => void;
}) => {
  const isLast = levelId >= LEVELS.length;
  return (
    <div className="relative">
      {/* confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 28 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * 400, rotate: 0, opacity: 1 }}
            animate={{ y: 600, rotate: 360 * (Math.random() > 0.5 ? 1 : -1), opacity: 0 }}
            transition={{ duration: 2 + Math.random(), delay: i * 0.05, ease: "linear" }}
            className="absolute w-2 h-3"
            style={{
              background: ["#fde047", "#fb7185", "#a78bfa", "#34d399", "#60a5fa"][i % 5],
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="bg-gradient-to-br from-primary to-secondary p-6 text-center text-primary-foreground">
        <motion.h2
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
          className="font-display text-4xl font-bold drop-shadow-md"
        >
          GOT YOU!
        </motion.h2>
        <p className="font-bold mt-1 opacity-90">
          {isLast ? "You beat the Mouse King!" : `Level ${levelId} complete!`}
        </p>
      </div>
      <div className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <StarRating stars={outcome.stars} size={48} animate />
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted rounded-2xl p-3">
            <div className="text-xs uppercase font-bold text-muted-foreground">Time Left</div>
            <div className="font-display font-bold text-2xl">{outcome.timeRemaining.toFixed(1)}s</div>
          </div>
          <div className="bg-muted rounded-2xl p-3">
            <div className="text-xs uppercase font-bold text-muted-foreground">Score</div>
            <div className="font-display font-bold text-2xl">{outcome.score.toLocaleString()}</div>
          </div>
        </div>
        <div className="grid gap-2 pt-2">
          <Button
            size="lg"
            className="font-display font-bold"
            onClick={onNext}
            data-testid="button-next"
          >
            {isLast ? "Back to Levels" : "Next Level"} <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            className="font-display font-bold"
            onClick={onRestart}
            data-testid="button-replay"
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Replay
          </Button>
          <Link href="/">
            <Button variant="ghost" className="w-full font-display font-bold">
              <Home className="mr-2 h-4 w-4" /> Menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const LosePanel = ({ reason, onRestart }: { reason: "time" | "trap"; onRestart: () => void }) => (
  <div>
    <div className="bg-gradient-to-br from-destructive to-secondary p-6 text-center text-destructive-foreground">
      <motion.div
        initial={{ rotate: 0 }}
        animate={{ rotate: [0, -10, 10, -8, 0] }}
        transition={{ duration: 0.6 }}
      >
        <X className="h-14 w-14 mx-auto mb-2 stroke-[3]" />
      </motion.div>
      <h2 className="font-display text-4xl font-bold drop-shadow-md">
        {reason === "trap" ? "SNAP!" : "TIME'S UP!"}
      </h2>
      <p className="font-bold mt-1 opacity-90">
        {reason === "trap" ? "You stepped in a trap!" : "The mouse got away..."}
      </p>
    </div>
    <div className="p-6 grid gap-2">
      <Button
        size="lg"
        className="font-display font-bold"
        onClick={onRestart}
        data-testid="button-retry"
      >
        <RotateCcw className="mr-2 h-5 w-5" /> Try Again
      </Button>
      <Link href="/levels">
        <Button variant="secondary" className="w-full font-display font-bold">
          Choose Level
        </Button>
      </Link>
      <Link href="/">
        <Button variant="ghost" className="w-full font-display font-bold">
          <Home className="mr-2 h-4 w-4" /> Menu
        </Button>
      </Link>
    </div>
  </div>
);

const HintBanner = ({ hint, levelId }: { hint: string; levelId: number }) => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, [levelId]);
  return (
    <div
      className="absolute bottom-6 inset-x-0 flex justify-center pointer-events-none z-10 px-4 md:px-0 md:bottom-10 transition-all duration-500 ease-out"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(60px)",
      }}
    >
      <div className="bg-card/95 backdrop-blur border-2 border-primary rounded-full px-5 py-2 shadow-lg max-w-md text-center">
        <span className="font-display font-bold text-sm">{hint}</span>
      </div>
    </div>
  );
};
