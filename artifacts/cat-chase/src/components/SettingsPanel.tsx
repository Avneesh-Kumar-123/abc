import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Modal } from "./Modal";
import { sfx, setAudioMuted } from "@/game/audio";
import { resetSave, updateSettings } from "@/game/storage";
import type { GameSettings, SaveData, Difficulty } from "@/game/types";
import { useState } from "react";
import { RotateCcw, X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  save: SaveData;
  onSave: (s: SaveData) => void;
};

export const SettingsPanel = ({ open, onClose, save, onSave }: Props) => {
  const [confirmReset, setConfirmReset] = useState(false);

  const setSound = (sound: boolean) => {
    setAudioMuted(!sound);
    onSave(updateSettings(save, { sound }));
    if (sound) sfx.click();
  };

  const setDifficulty = (difficulty: Difficulty) => {
    sfx.click();
    onSave(updateSettings(save, { difficulty }));
  };

  const handleReset = () => {
    resetSave();
    sfx.click();
    setConfirmReset(false);
    // reload to reinitialize defaults
    if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl font-bold">Settings</h2>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-settings">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold">Sound</div>
              <div className="text-sm text-muted-foreground">Music & effects</div>
            </div>
            <Switch checked={save.settings.sound} onCheckedChange={setSound} data-testid="switch-sound" />
          </div>

          <div>
            <div className="font-bold mb-2">Difficulty</div>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "normal", "hard"] as Difficulty[]).map((d) => {
                const active = save.settings.difficulty === d;
                const labels: Record<Difficulty, string> = { easy: "Easy", normal: "Normal", hard: "Hard" };
                return (
                  <Button
                    key={d}
                    variant={active ? "default" : "secondary"}
                    onClick={() => setDifficulty(d)}
                    className="font-display font-bold"
                    data-testid={`button-difficulty-${d}`}
                  >
                    {labels[d]}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            {!confirmReset ? (
              <Button
                variant="destructive"
                className="w-full font-display font-bold"
                onClick={() => setConfirmReset(true)}
                data-testid="button-reset"
              >
                <RotateCcw className="mr-2 h-4 w-4" /> Reset Progress
              </Button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-center text-muted-foreground">All progress will be lost!</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setConfirmReset(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReset}>Yes, reset</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
