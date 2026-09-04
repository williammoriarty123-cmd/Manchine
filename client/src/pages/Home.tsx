import { useEffect, useMemo, useRef, useState } from "react";

const FIRST_TRIALS = 5;
const SECOND_TRIALS = 8;

type StageOneMode = "intro" | "waiting" | "go" | "tooSoon" | "complete";
type StageTwoMode = "intro" | "waiting" | "target" | "tooSoon" | "feedback" | "complete";
type Target = "blue" | "red";
type StageTwoResult = { target: Target; response: "1" | "2"; ms: number; correct: boolean };

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
};

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
const formatMs = (value: number) => value ? `${value} ms` : "—";

export default function Home() {
  const [activeStage, setActiveStage] = useState<1 | 2 | "summary">(1);
  const [stageOneMode, setStageOneMode] = useState<StageOneMode>("intro");
  const [stageTwoMode, setStageTwoMode] = useState<StageTwoMode>("intro");
  const [stageOneTimes, setStageOneTimes] = useState<number[]>([]);
  const [stageTwoResults, setStageTwoResults] = useState<StageTwoResult[]>([]);
  const [lastStageOneTime, setLastStageOneTime] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<Target | null>(null);
  const [lastStageTwoResult, setLastStageTwoResult] = useState<StageTwoResult | null>(null);
  const [notice, setNotice] = useState("");
  const timerRef = useRef<number | null>(null);
  const signalAtRef = useRef(0);

  const stageOneMedian = useMemo(() => median(stageOneTimes), [stageOneTimes]);
  const correctResults = useMemo(() => stageTwoResults.filter((result) => result.correct), [stageTwoResults]);
  const stageTwoAverage = useMemo(() => average(correctResults.map((result) => result.ms)), [correctResults]);
  const accuracy = stageTwoResults.length ? Math.round((correctResults.length / stageTwoResults.length) * 100) : 0;
  const overallScore = stageOneMedian && stageTwoAverage ? Math.round((stageOneMedian + stageTwoAverage) / 2) : 0;

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => clearTimer(), []);

  const startStageOneSignal = () => {
    clearTimer();
    setNotice("");
    setStageOneMode("waiting");
    timerRef.current = window.setTimeout(() => {
      signalAtRef.current = performance.now();
      setStageOneMode("go");
    }, 1300 + Math.random() * 2700);
  };

  const handleStageOneAction = () => {
    if (stageOneMode === "intro") {
      startStageOneSignal();
      return;
    }
    if (stageOneMode === "waiting") {
      clearTimer();
      setNotice("You moved before the signal. Reset and try again.");
      setStageOneMode("tooSoon");
      return;
    }
    if (stageOneMode === "go") {
      const result = Math.round(performance.now() - signalAtRef.current);
      const nextTimes = [...stageOneTimes, result];
      setLastStageOneTime(result);
      setStageOneTimes(nextTimes);
      setNotice("");
      setStageOneMode(nextTimes.length >= FIRST_TRIALS ? "complete" : "intro");
    }
  };

  const startStageTwoSignal = () => {
    clearTimer();
    setCurrentTarget(null);
    setNotice("");
    setStageTwoMode("waiting");
    timerRef.current = window.setTimeout(() => {
      const nextTarget: Target = Math.random() > 0.5 ? "blue" : "red";
      setCurrentTarget(nextTarget);
      signalAtRef.current = performance.now();
      setStageTwoMode("target");
    }, 1100 + Math.random() * 2400);
  };

  const enterStageTwo = () => {
    setActiveStage(2);
    setStageTwoMode("intro");
    setNotice("");
  };

  const handleStageTwoResponse = (response: "1" | "2") => {
    if (stageTwoMode === "intro") {
      startStageTwoSignal();
      return;
    }
    if (stageTwoMode === "waiting") {
      clearTimer();
      setNotice("Too early. Wait for a shape, then match its key.");
      setStageTwoMode("tooSoon");
      return;
    }
    if (stageTwoMode !== "target" || !currentTarget) return;
    const result: StageTwoResult = {
      target: currentTarget,
      response,
      ms: Math.round(performance.now() - signalAtRef.current),
      correct: (currentTarget === "blue" && response === "1") || (currentTarget === "red" && response === "2"),
    };
    const nextResults = [...stageTwoResults, result];
    setLastStageTwoResult(result);
    setStageTwoResults(nextResults);
    setStageTwoMode(nextResults.length >= SECOND_TRIALS ? "complete" : "feedback");
    if (nextResults.length < SECOND_TRIALS) {
      window.setTimeout(() => startStageTwoSignal(), 720);
    }
  };

  const handleStageTwoFieldClick = () => {
    if (stageTwoMode === "intro" || stageTwoMode === "tooSoon") {
      startStageTwoSignal();
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeStage === 1 && (stageOneMode === "intro" || stageOneMode === "waiting" || stageOneMode === "go" || stageOneMode === "tooSoon")) {
        if (event.code === "Space" || event.code === "Enter") {
          event.preventDefault();
          handleStageOneAction();
        }
      }
      if (activeStage === 2 && (event.key === "1" || event.key === "2")) {
        event.preventDefault();
        handleStageTwoResponse(event.key as "1" | "2");
      }
      if (activeStage === "summary" && event.key === "Enter") {
        event.preventDefault();
        restart();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const restart = () => {
    clearTimer();
    setActiveStage(1);
    setStageOneMode("intro");
    setStageTwoMode("intro");
    setStageOneTimes([]);
    setStageTwoResults([]);
    setLastStageOneTime(0);
    setCurrentTarget(null);
    setLastStageTwoResult(null);
    setNotice("");
  };

  const displayStage = activeStage === "summary" ? 3 : activeStage;
  const stageOneProgress = Math.min(stageOneTimes.length, FIRST_TRIALS);
  const stageTwoProgress = Math.min(stageTwoResults.length, SECOND_TRIALS);
  const stageOneFieldClass = stageOneMode === "go" ? "test-field test-field--go" : stageOneMode === "waiting" ? "test-field test-field--waiting" : "test-field";
  const stageTwoFieldClass = stageTwoMode === "waiting" ? "test-field test-field--waiting" : stageTwoMode === "target" ? `test-field test-field--target-${currentTarget}` : "test-field";

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><div className="brand-name">PULSE</div><div className="brand-sub">REACTION LAB / 02</div></div>
        </div>
        <div className="topbar-status"><span className="status-dot" /> local session <span className="status-divider" /> no tracking</div>
      </header>

      <div className="workspace">
        <aside className="stage-rail">
          <div className="rail-label">SEQUENCE</div>
          <div className={`stage-item ${activeStage === 1 ? "stage-item--active" : ""} ${stageOneMode === "complete" || activeStage === 2 || activeStage === "summary" ? "stage-item--done" : ""}`}>
            <div className="stage-number">01</div>
            <div><div className="stage-title">Pure reaction</div><div className="stage-caption">color shift / click</div></div>
            {stageOneMode === "complete" || activeStage === 2 || activeStage === "summary" ? <span className="stage-check">✓</span> : null}
          </div>
          <div className="rail-line" />
          <div className={`stage-item ${activeStage === 2 ? "stage-item--active" : ""} ${stageTwoMode === "complete" || activeStage === "summary" ? "stage-item--done" : ""}`}>
            <div className="stage-number">02</div>
            <div><div className="stage-title">Signal switch</div><div className="stage-caption">shape + key / react</div></div>
            {stageTwoMode === "complete" || activeStage === "summary" ? <span className="stage-check">✓</span> : null}
          </div>
          <div className="rail-line rail-line--short" />
          <div className={`stage-item stage-item--final ${activeStage === "summary" ? "stage-item--active" : ""}`}>
            <div className="stage-number">03</div>
            <div><div className="stage-title">Readout</div><div className="stage-caption">your signal profile</div></div>
          </div>
          <div className="rail-note"><span className="note-icon">i</span><p>Measure your latency, not your worth. Every screen adds a few milliseconds.</p></div>
        </aside>

        <section className="main-column">
          <div className="eyebrow-row"><span className="eyebrow">TWO-STAGE PROTOCOL</span><span className="eyebrow-line" /><span className="eyebrow-meta">{String(displayStage).padStart(2, "0")} / 03</span></div>
          <div className="headline-row">
            <div><h1>{activeStage === 1 ? "Find your green light." : activeStage === 2 ? "Switch on signal." : "Your signal profile."}</h1><p>{activeStage === 1 ? "A clean baseline for how quickly you respond to change." : activeStage === 2 ? "The rule changes mid-flight. Stay sharp, stay literal." : "Two tests. One read on your real-time response."}</p></div>
            {activeStage !== "summary" ? <div className="trial-counter"><span className="counter-label">TRIAL</span><strong>{String((activeStage === 1 ? stageOneProgress : stageTwoProgress) + 1).padStart(2, "0")}</strong><span className="counter-total">/ {String(activeStage === 1 ? FIRST_TRIALS : SECOND_TRIALS).padStart(2, "0")}</span></div> : <button className="quiet-button" onClick={restart}>↻ start over</button>}
          </div>

          {activeStage === 1 ? (
            <div className="test-card">
              <button className={stageOneFieldClass} onClick={handleStageOneAction} aria-label="Reaction time test field">
                <span className="field-grid" />
                {stageOneMode === "intro" && <span className="field-message"><strong>Click to begin</strong><small>the field will turn green</small></span>}
                {stageOneMode === "waiting" && <span className="field-message field-message--waiting"><strong>Wait for green</strong><small>do not click yet</small></span>}
                {stageOneMode === "go" && <span className="field-message field-message--go"><strong>CLICK</strong><small>now</small></span>}
                {stageOneMode === "tooSoon" && <span className="field-message field-message--error"><strong>Too soon.</strong><small>Click to try again</small></span>}
                {stageOneMode === "complete" && <span className="field-message field-message--complete"><strong>{formatMs(stageOneMedian)}</strong><small>median · continue below</small></span>}
              </button>
              <div className="test-card-footer"><span><kbd>SPACE</kbd> also works</span><span className="footer-rule" /><span>baseline / click latency</span></div>
            </div>
          ) : activeStage === 2 ? (
            <div className="test-card">
              <button className={stageTwoFieldClass} onClick={handleStageTwoFieldClick} aria-label="Signal test field">
                <span className="field-grid" />
                {stageTwoMode === "intro" && <span className="field-message"><strong>Press 1 or 2 to begin</strong><small>blue box = 1 · red circle = 2</small></span>}
                {stageTwoMode === "waiting" && <span className="field-message field-message--waiting"><strong>Get ready</strong><small>watch the field</small></span>}
                {stageTwoMode === "tooSoon" && <span className="field-message field-message--error"><strong>Too soon.</strong><small>Press 1 or 2 to reset</small></span>}
                {stageTwoMode === "feedback" && lastStageTwoResult && <span className={`field-message ${lastStageTwoResult.correct ? "field-message--go" : "field-message--error"}`}><strong>{lastStageTwoResult.correct ? "Correct" : "Missed"}</strong><small>{formatMs(lastStageTwoResult.ms)} · next signal incoming</small></span>}
                {stageTwoMode === "target" && currentTarget && <span className={`shape-target ${currentTarget === "blue" ? "shape-target--blue" : "shape-target--red"}`} aria-hidden="true"><span className="shape-label">{currentTarget === "blue" ? "1" : "2"}</span></span>}
                {stageTwoMode === "complete" && <span className="field-message field-message--complete"><strong>{accuracy}% accurate</strong><small>{formatMs(stageTwoAverage)} avg. correct response</small></span>}
              </button>
              <div className="key-dock"><button className="key-action key-action--blue" onClick={() => handleStageTwoResponse("1")}><kbd>1</kbd><span>blue box</span></button><span className="key-or">or</span><button className="key-action key-action--red" onClick={() => handleStageTwoResponse("2")}><kbd>2</kbd><span>red circle</span></button></div>
            </div>
          ) : (
            <div className="summary-card">
              <div className="summary-hero"><div className="summary-kicker">PROTOCOL COMPLETE</div><div className="summary-score">{overallScore}<span>ms</span></div><p>composite response index</p></div>
              <div className="summary-grid"><div className="summary-stat"><span>01 / pure reaction</span><strong>{formatMs(stageOneMedian)}</strong><small>median across {FIRST_TRIALS} clicks</small></div><div className="summary-stat"><span>02 / signal switch</span><strong>{formatMs(stageTwoAverage)}</strong><small>average across correct calls</small></div><div className="summary-stat"><span>signal accuracy</span><strong>{accuracy}%</strong><small>{correctResults.length} of {SECOND_TRIALS} calls correct</small></div></div>
              <div className="summary-foot"><span>Want a cleaner read? Run it again.</span><button className="primary-button" onClick={restart}>Run protocol again <span>↗</span></button></div>
            </div>
          )}

          {notice && <div className="notice"><span>!</span>{notice}</div>}
          {activeStage === 1 && stageOneMode === "complete" && <button className="primary-button continue-button" onClick={enterStageTwo}>Continue to stage 02 <span>→</span></button>}
          {activeStage === 2 && stageTwoMode === "complete" && <button className="primary-button continue-button" onClick={() => setActiveStage("summary")}>View signal profile <span>→</span></button>}

          <div className="lower-strip"><div className="micro-stat"><span>YOUR BEST</span><strong>{stageOneTimes.length ? formatMs(Math.min(...stageOneTimes)) : "—"}</strong></div><div className="micro-stat"><span>STAGE 02 ACCURACY</span><strong>{stageTwoResults.length ? `${accuracy}%` : "—"}</strong></div><div className="micro-copy">Results stay in this browser session<br />and disappear when you leave.</div></div>
        </section>

        <aside className="telemetry-panel">
          <div className="panel-heading"><span>LIVE TELEMETRY</span><span className="pulse-line" /></div>
          <div className="telemetry-block"><span className="telemetry-label">CURRENT READOUT</span><strong>{activeStage === 1 ? formatMs(lastStageOneTime) : activeStage === 2 ? (lastStageTwoResult ? formatMs(lastStageTwoResult.ms) : "—") : formatMs(overallScore)}</strong><small>{activeStage === 1 ? (stageOneTimes.length ? "latest click" : "waiting for input") : activeStage === 2 ? (lastStageTwoResult ? (lastStageTwoResult.correct ? "correct signal" : "wrong key") : "waiting for input") : "composite index"}</small></div>
          <div className="telemetry-rule" />
          <div className="telemetry-block telemetry-block--compact"><span className="telemetry-label">SESSION MEDIAN</span><strong>{formatMs(stageOneMedian)}</strong></div>
          <div className="telemetry-block telemetry-block--compact"><span className="telemetry-label">ACCURACY</span><strong>{stageTwoResults.length ? `${accuracy}%` : "—"}</strong></div>
          <div className="instruction-card"><div className="instruction-index">HOW IT WORKS</div><h3>{activeStage === 1 ? "Wait for the field to change." : activeStage === 2 ? "Read the shape, then map the key." : "Compare both response modes."}</h3><p>{activeStage === 1 ? "The clock starts on green, not before. Click anywhere inside the field as quickly as you can." : activeStage === 2 ? "A blue box asks for 1. A red circle asks for 2. Early inputs count as a reset." : "Pure reaction measures speed. Signal switch adds a decision under pressure."}</p></div>
          <div className="key-guide"><div className="guide-row"><kbd>{activeStage === 1 ? "SPACE" : "1"}</kbd><span>{activeStage === 1 ? "start / click" : "blue box"}</span></div><div className="guide-row"><kbd>{activeStage === 1 ? "CLICK" : "2"}</kbd><span>{activeStage === 1 ? "anywhere in field" : "red circle"}</span></div></div>
        </aside>
      </div>
      <footer className="site-footer"><span>PULSE / REACTION LAB</span><span>BUILT FOR A CALM NERVOUS SYSTEM</span><span>LOCAL ONLY · 2026</span></footer>
    </main>
  );
}
