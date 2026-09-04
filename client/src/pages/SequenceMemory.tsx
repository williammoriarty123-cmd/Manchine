import { useCallback, useEffect, useRef, useState } from "react";

const TOTAL_ROUNDS = 5;
const START_LENGTH = 3;
const SHOW_INTERVAL = 620;

type Mode = "ready" | "showing" | "input" | "success" | "failed" | "complete";

const makeSequence = (length: number) => {
  const next: number[] = [];
  while (next.length < length) {
    const value = Math.floor(Math.random() * 9);
    if (next[next.length - 1] !== value) next.push(value);
  }
  return next;
};

export default function SequenceMemory() {
  const [mode, setMode] = useState<Mode>("ready");
  const [round, setRound] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [shownIndex, setShownIndex] = useState(-1);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  const [bestRound, setBestRound] = useState(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const beginRound = useCallback((roundIndex: number) => {
    clearTimers();
    const nextSequence = makeSequence(START_LENGTH + roundIndex);
    setRound(roundIndex);
    setSequence(nextSequence);
    setUserSequence([]);
    setLastResult(null);
    setMode("showing");
    setShownIndex(-1);

    nextSequence.forEach((_, index) => {
      timers.current.push(window.setTimeout(() => setShownIndex(index), 260 + index * SHOW_INTERVAL));
    });
    timers.current.push(window.setTimeout(() => {
      setShownIndex(-1);
      setMode("input");
    }, 260 + nextSequence.length * SHOW_INTERVAL));
  }, [clearTimers]);

  const start = () => beginRound(0);

  const handleCell = (cell: number) => {
    if (mode === "ready" || mode === "failed") {
      beginRound(mode === "failed" ? round : 0);
      return;
    }
    if (mode !== "input") return;

    const position = userSequence.length;
    const nextUserSequence = [...userSequence, cell];
    setUserSequence(nextUserSequence);

    if (sequence[position] !== cell) {
      setLastResult("wrong");
      setMode("failed");
      return;
    }

    if (nextUserSequence.length === sequence.length) {
      setLastResult("correct");
      setBestRound((current) => Math.max(current, round + 1));
      if (round + 1 >= TOTAL_ROUNDS) setMode("complete");
      else setMode("success");
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key >= "1" && event.key <= "9") handleCell(Number(event.key) - 1);
      if (event.key === "Enter" && (mode === "ready" || mode === "failed" || mode === "complete")) start();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const continueAfterSuccess = () => beginRound(round + 1);
  const progress = mode === "complete" ? TOTAL_ROUNDS : round;
  const currentLength = sequence.length || START_LENGTH;
  const message = mode === "ready" ? "Click to begin" : mode === "showing" ? "Watch the pattern" : mode === "input" ? "Repeat the pattern" : mode === "success" ? "Pattern locked" : mode === "failed" ? "Sequence broken" : "Protocol complete";
  const submessage = mode === "ready" ? "the cells will light one by one" : mode === "showing" ? `${currentLength} cells · stay focused` : mode === "input" ? `${userSequence.length} of ${currentLength} entered` : mode === "success" ? "Nice work. Ready for the next layer?" : mode === "failed" ? "One miss ends the round" : "You kept the signal alive";

  return (
    <main className="app-shell memory-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><div className="brand-name">PULSE</div><div className="brand-sub">COGNITIVE LAB / 03</div></div>
        </div>
        <div className="topbar-status"><span className="status-dot" /> local session <span className="status-divider" /> no tracking</div>
      </header>

      <div className="workspace memory-workspace">
        <aside className="stage-rail">
          <div className="rail-label">PROTOCOL</div>
          <div className="stage-item stage-item--active"><div className="stage-number">01</div><div><div className="stage-title">Sequence memory</div><div className="stage-caption">visual order / recall</div></div></div>
          <div className="rail-line" />
          <div className={`stage-item ${mode === "complete" ? "stage-item--done" : ""}`}><div className="stage-number">02</div><div><div className="stage-title">Readout</div><div className="stage-caption">your memory span</div></div>{mode === "complete" && <span className="stage-check">✓</span>}</div>
          <div className="rail-note"><span className="note-icon">i</span><p>Each round adds one light. Accuracy beats speed here.</p></div>
        </aside>

        <section className="main-column">
          <div className="eyebrow-row"><span className="eyebrow">SEQUENCE MEMORY</span><span className="eyebrow-line" /><span className="eyebrow-meta">03 / 03</span></div>
          <div className="headline-row">
            <div><h1>Hold the signal.</h1><p>Watch the grid. Rebuild the exact order from memory.</p></div>
            <div className="trial-counter"><span className="counter-label">ROUND</span><strong>{String(Math.min(progress + 1, TOTAL_ROUNDS)).padStart(2, "0")}</strong><span className="counter-total">/ {String(TOTAL_ROUNDS).padStart(2, "0")}</span></div>
          </div>

          <div className="memory-card">
            <div className={`memory-board memory-board--${mode}`}>
              <div className="board-orbit orbit-one" /><div className="board-orbit orbit-two" />
              {Array.from({ length: 9 }, (_, cell) => {
                const isLit = mode === "showing" && sequence[shownIndex] === cell;
                const wasEntered = mode !== "showing" && userSequence.includes(cell);
                return <button key={cell} className={`memory-cell ${isLit ? "memory-cell--lit" : ""} ${wasEntered ? "memory-cell--entered" : ""}`} onClick={() => handleCell(cell)} aria-label={`Grid cell ${cell + 1}`} disabled={mode === "showing" || mode === "success" || mode === "complete"}><span>{mode === "input" && userSequence.length > 0 && userSequence[userSequence.length - 1] === cell ? userSequence.length : ""}</span></button>;
              })}
              <div className="board-message"><strong>{message}</strong><small>{submessage}</small></div>
            </div>
            <div className="memory-footer"><span><kbd>1—9</kbd> keyboard shortcuts</span><span className="footer-rule" /><span>{mode === "showing" ? "encoding sequence" : mode === "input" ? "recall phase" : "visual memory / order"}</span></div>
          </div>

          {mode === "ready" && <button className="primary-button continue-button" onClick={start}>Start test <span>→</span></button>}
          {mode === "success" && <button className="primary-button continue-button" onClick={continueAfterSuccess}>Next round <span>→</span></button>}
          {mode === "failed" && <button className="primary-button continue-button" onClick={() => beginRound(round)}>Retry round <span>↻</span></button>}
          {mode === "complete" && <button className="primary-button continue-button" onClick={start}>Run again <span>↗</span></button>}

          <div className="lower-strip"><div className="micro-stat"><span>LONGEST SPAN</span><strong>{bestRound ? `${START_LENGTH + bestRound - 1} cells` : "—"}</strong></div><div className="micro-stat"><span>PROGRESS</span><strong>{progress} / {TOTAL_ROUNDS}</strong></div><div className="micro-copy">Results stay in this browser session<br />and disappear when you leave.</div></div>
        </section>

        <aside className="telemetry-panel">
          <div className="panel-heading"><span>MEMORY TELEMETRY</span><span className="pulse-line" /></div>
          <div className="telemetry-block"><span className="telemetry-label">CURRENT SPAN</span><strong>{mode === "ready" ? "—" : currentLength}</strong><small>cells in this sequence</small></div>
          <div className="telemetry-rule" />
          <div className="telemetry-block telemetry-block--compact"><span className="telemetry-label">ROUND</span><strong>{String(progress).padStart(2, "0")} / {String(TOTAL_ROUNDS).padStart(2, "0")}</strong></div>
          <div className="instruction-card"><span className="instruction-index">HOW TO PLAY</span><h3>Encode. Recall. Repeat.</h3><p>Focus on each flash, then tap the cells in the same order. The sequence grows after every clean round.</p></div>
          <div className="key-guide"><div className="guide-row"><kbd>01—09</kbd><span>select a cell</span></div><div className="guide-row"><kbd>ENTER</kbd><span>start / replay</span></div></div>
        </aside>
      </div>
      <footer className="site-footer"><span>PULSE / COGNITIVE PERFORMANCE</span><span>SEQUENCE MEMORY / v1.0</span><span>SESSION LOCAL</span></footer>
    </main>
  );
}
