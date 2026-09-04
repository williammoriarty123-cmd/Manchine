import { useCallback, useEffect, useRef, useState } from "react";

const START_LENGTH = 3;

type Mode = "ready" | "showing" | "input" | "success" | "failed";

const makeNumber = (length: number) => {
  const first = String(Math.floor(Math.random() * 9) + 1);
  return first + Array.from({ length: length - 1 }, () => Math.floor(Math.random() * 10)).join("");
};

export default function NumberMemory() {
  const [mode, setMode] = useState<Mode>("ready");
  const [round, setRound] = useState(0);
  const [number, setNumber] = useState("");
  const [answer, setAnswer] = useState("");
  const [bestLength, setBestLength] = useState(0);
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const beginRound = useCallback((roundIndex: number) => {
    clearTimer();
    const nextNumber = makeNumber(START_LENGTH + roundIndex);
    setRound(roundIndex);
    setNumber(nextNumber);
    setAnswer("");
    setMode("showing");
    timerRef.current = window.setTimeout(() => {
      setMode("input");
      window.setTimeout(() => inputRef.current?.focus(), 40);
    }, 1400 + nextNumber.length * 260);
  }, [clearTimer]);

  const start = () => beginRound(0);

  const submitAnswer = () => {
    if (mode !== "input" || !answer.trim()) return;
    const isCorrect = answer.trim() === number;
    if (!isCorrect) {
      setMode("failed");
      return;
    }
    setBestLength((current) => Math.max(current, number.length));
    setMode("success");
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (mode === "ready" || mode === "failed") start();
        else if (mode === "input") submitAnswer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const progress = round;
  const currentLength = number.length || START_LENGTH;
  const message = mode === "ready" ? "Click to begin" : mode === "showing" ? number : mode === "input" ? "What was the number?" : mode === "success" ? "Correct" : "Not quite";
  const submessage = mode === "ready" ? "a number will appear briefly" : mode === "showing" ? `${currentLength} digits · encode the signal` : mode === "input" ? "type the digits, then press enter" : mode === "success" ? "The next round adds one digit" : `The number was ${number}`;

  return (
    <main className="app-shell number-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark" aria-hidden="true"><span /><span /><span /></div><div><div className="brand-name">PULSE</div><div className="brand-sub">COGNITIVE LAB / 03</div></div></div>
        <div className="topbar-status"><span className="status-dot" /> local session <span className="status-divider" /> no tracking</div>
      </header>

      <div className="workspace memory-workspace">
        <aside className="stage-rail">
          <div className="rail-label">PROTOCOL</div>
          <div className="stage-item stage-item--active"><div className="stage-number">01</div><div><div className="stage-title">Number memory</div><div className="stage-caption">digits / recall</div></div></div>
          <div className="rail-line" />
          <div className="stage-item"><div className="stage-number">02</div><div><div className="stage-title">Readout</div><div className="stage-caption">your memory span</div></div></div>
          <div className="rail-note"><span className="note-icon">i</span><p>Numbers fade fast. Give the signal your full attention, then trust the recall.</p></div>
        </aside>

        <section className="main-column">
          <div className="eyebrow-row"><span className="eyebrow">NUMBER MEMORY</span><span className="eyebrow-line" /><span className="eyebrow-meta">03 / 03</span></div>
          <div className="headline-row"><div><h1>Keep the number.</h1><p>Read the signal once. Rebuild it exactly after it disappears.</p></div><div className="trial-counter"><span className="counter-label">ROUND</span><strong>{String(progress + 1).padStart(2, "0")}</strong><span className="counter-total">/ ∞</span></div></div>

          <div className="number-card">
            <div className={`number-field number-field--${mode}`}>
              <div className="number-ruler" aria-hidden="true"><span /><span /><span /><span /><span /></div>
              {mode !== "input" ? <div className="number-message"><strong>{message}</strong><small>{submessage}</small></div> : <form className="number-form" onSubmit={(event) => { event.preventDefault(); submitAnswer(); }}><label htmlFor="number-answer">{message}</label><input ref={inputRef} id="number-answer" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={answer} onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))} aria-label="Your number memory answer" /><small>{submessage}</small><button className="primary-button" type="submit">Submit answer <span>→</span></button></form>}
            </div>
            <div className="memory-footer"><span><kbd>ENTER</kbd> submit answer</span><span className="footer-rule" /><span>{mode === "showing" ? "encoding signal" : mode === "input" ? "recall phase" : "numeric span / order"}</span></div>
          </div>

          {mode === "ready" && <button className="primary-button continue-button" onClick={start}>Start test <span>→</span></button>}
          {mode === "success" && <button className="primary-button continue-button" onClick={() => beginRound(round + 1)}>Next round <span>→</span></button>}
          {mode === "failed" && <button className="primary-button continue-button" onClick={() => beginRound(round)}>Retry round <span>↻</span></button>}
          

          <div className="lower-strip"><div className="micro-stat"><span>LONGEST SPAN</span><strong>{bestLength ? `${bestLength} digits` : "—"}</strong></div><div className="micro-stat"><span>ROUNDS CLEARED</span><strong>{progress}</strong></div><div className="micro-copy">The test continues until your first miss.<br />Results stay in this browser session.</div></div>
        </section>

        <aside className="telemetry-panel"><div className="panel-heading"><span>MEMORY TELEMETRY</span><span className="pulse-line" /></div><div className="telemetry-block"><span className="telemetry-label">CURRENT SPAN</span><strong>{mode === "ready" ? "—" : currentLength}</strong><small>digits in this number</small></div><div className="telemetry-rule" /><div className="telemetry-block telemetry-block--compact"><span className="telemetry-label">ROUNDS CLEARED</span><strong>{String(progress).padStart(2, "0")}</strong></div><div className="instruction-card"><span className="instruction-index">HOW TO PLAY</span><h3>Encode. Hide. Recall.</h3><p>A number appears briefly, then disappears. Type it from memory and extend your span one digit at a time. The test ends when you miss.</p></div><div className="key-guide"><div className="guide-row"><kbd>0—9</kbd><span>enter a digit</span></div><div className="guide-row"><kbd>ENTER</kbd><span>submit / restart</span></div></div></aside>
      </div>
      <footer className="site-footer"><span>PULSE / COGNITIVE PERFORMANCE</span><span>NUMBER MEMORY / v1.0</span><span>SESSION LOCAL</span></footer>
    </main>
  );
}
