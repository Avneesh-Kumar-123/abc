import { useEffect, useState } from "react";
import { Switch, Route, Router as WouterRouter, useParams } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Splash } from "@/pages/Splash";
import { Levels } from "@/pages/Levels";
import { HowToPlay } from "@/pages/HowToPlay";
import { Credits } from "@/pages/Credits";
import { Play } from "@/pages/Play";
import { LEVELS } from "@/game/levels";
import { loadSave } from "@/game/storage";
import { setAudioMuted } from "@/game/audio";
import type { SaveData } from "@/game/types";

const PlayRoute = ({ save, onSave }: { save: SaveData; onSave: (s: SaveData) => void }) => {
  const params = useParams<{ id: string }>();
  const id = Number(params.id ?? "1");
  const safeId = Number.isFinite(id) && id >= 1 && id <= LEVELS.length ? id : 1;
  return <Play levelId={safeId} save={save} onSave={onSave} />;
};

function App() {
  const [save, setSave] = useState<SaveData>(() => loadSave());

  useEffect(() => {
    setAudioMuted(!save.settings.sound);
  }, [save.settings.sound]);

  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Switch>
          <Route path="/" component={() => <Splash save={save} onSave={setSave} />} />
          <Route path="/play/:id" component={() => <PlayRoute save={save} onSave={setSave} />} />
          <Route path="/play" component={() => <PlayRoute save={save} onSave={setSave} />} />
          <Route path="/levels" component={() => <Levels save={save} />} />
          <Route path="/how-to-play" component={() => <HowToPlay />} />
          <Route path="/credits" component={() => <Credits />} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </WouterRouter>
    </TooltipProvider>
  );
}

export default App;
