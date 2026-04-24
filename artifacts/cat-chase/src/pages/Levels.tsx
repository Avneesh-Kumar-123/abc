import { motion } from "framer-motion";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { MenuShell } from "@/components/MenuShell";
import { StarRating } from "@/components/StarRating";
import { LEVELS } from "@/game/levels";
import { sfx } from "@/game/audio";
import type { SaveData } from "@/game/types";

type Props = { save: SaveData };

export const Levels = ({ save }: Props) => {
  return (
    <MenuShell themeBg={["#fce7f3", "#e0e7ff"]}>
      <div className="relative z-10 min-h-screen px-6 pt-20 pb-10 max-w-5xl mx-auto">
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="font-display font-bold text-4xl sm:text-5xl text-center mb-2"
        >
          Choose Your <span className="text-primary">Stage</span>
        </motion.h1>
        <p className="text-center text-muted-foreground mb-8 font-bold">
          Catch the mouse in every world to unlock the next.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEVELS.map((lvl, i) => {
            const prog = save.levels[lvl.id];
            const unlocked = prog?.unlocked ?? false;
            const stars = prog?.bestStars ?? 0;
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={unlocked ? { y: -6, scale: 1.02 } : undefined}
                className={`relative overflow-hidden rounded-3xl border-4 ${
                  unlocked ? "border-primary cursor-pointer" : "border-muted-border opacity-70"
                } shadow-lg`}
                style={{
                  background: `linear-gradient(135deg, ${lvl.theme.bgGradient[0]}, ${lvl.theme.bgGradient[1]})`,
                  minHeight: 220,
                }}
                onClick={() => unlocked && sfx.click()}
                data-testid={`card-level-${lvl.id}`}
              >
                <div className="absolute top-3 right-3 bg-card/90 backdrop-blur rounded-full px-3 py-1 border-2 border-card-border">
                  <span className="font-display font-bold text-sm">Lv {lvl.id}</span>
                </div>
                <div className="absolute inset-0 p-5 flex flex-col justify-end">
                  <div className="bg-card/85 backdrop-blur rounded-2xl p-4 border-2 border-card-border">
                    <h3 className="font-display font-bold text-xl">{lvl.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{lvl.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <StarRating stars={stars} size={20} />
                      {prog && prog.bestTimeRemaining > 0 ? (
                        <div className="text-xs font-mono font-bold text-muted-foreground">
                          best: {prog.bestTimeRemaining.toFixed(1)}s
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!unlocked && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-card rounded-full p-4 border-4 border-card-border">
                      <Lock className="h-8 w-8" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
            return unlocked ? (
              <Link key={lvl.id} href={`/play/${lvl.id}`}>
                {card}
              </Link>
            ) : (
              <div key={lvl.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </MenuShell>
  );
};
