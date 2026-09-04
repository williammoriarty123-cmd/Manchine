import { Link } from "wouter";

export default function Home() {
  return (
    <main className="app-shell home-hub">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true"><span /><span /><span /></div>
          <div><div className="brand-name">PULSE</div><div className="brand-sub">COGNITIVE LAB / 03</div></div>
        </div>
        <div className="topbar-status"><span className="status-dot" /> local session <span className="status-divider" /> no tracking</div>
      </header>

      <div className="hub-shell">
        <section className="hub-hero">
          <div className="eyebrow-row"><span className="eyebrow">THE PULSE INDEX</span><span className="eyebrow-line" /><span className="eyebrow-meta">02 TESTS / 00 TRACKING</span></div>
          <div className="hub-hero-content">
            <div>
              <h1>Measure the way<br /><em>you respond.</em></h1>
              <p>Short, focused experiments for reaction, recall, and the tiny signals that make your mind your own.</p>
              <Link className="primary-button hub-cta" href="#tests">Explore the tests <span>↓</span></Link>
            </div>
            <div className="hero-orbit" aria-hidden="true"><div className="hero-orbit-ring ring-a" /><div className="hero-orbit-ring ring-b" /><div className="orbit-core"><span>02</span><small>LIVE TESTS</small></div><i className="orbit-dot dot-a" /><i className="orbit-dot dot-b" /></div>
          </div>
        </section>

        <section className="tests-section" id="tests">
          <div className="section-heading"><div><span className="eyebrow">AVAILABLE PROTOCOLS</span><h2>Start with a signal.</h2></div><span className="section-note">01—02 / LOCAL ONLY</span></div>
          <div className="test-grid">
            <Link className="test-tile test-tile--reaction" href="/reaction-time">
              <div className="tile-top"><span className="tile-index">01</span><span className="tile-status">FOUNDATION</span></div>
              <div className="tile-visual reaction-visual" aria-hidden="true"><div className="reaction-cross cross-one" /><div className="reaction-cross cross-two" /><div className="reaction-signal">GO</div></div>
              <div className="tile-copy"><h3>Reaction Time</h3><p>Test your visual reflexes across a clean five-trial baseline.</p><span className="tile-link">Run test <b>↗</b></span></div>
            </Link>
            <Link className="test-tile test-tile--memory" href="/sequence-memory">
              <div className="tile-top"><span className="tile-index">02</span><span className="tile-status tile-status--new">NEW / FEATURED</span></div>
              <div className="tile-visual memory-visual" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <span key={index} className={index === 4 || index === 7 ? "visual-cell visual-cell--lit" : "visual-cell"}>{index === 7 ? "2" : ""}</span>)}</div>
              <div className="tile-copy"><h3>Sequence Memory</h3><p>Remember an increasingly long pattern of button presses.</p><span className="tile-link">Run test <b>↗</b></span></div>
            </Link>
          </div>
        </section>

        <section className="hub-note"><span className="note-icon">i</span><p>Built for curiosity, not judgment. Your results stay in this browser session and disappear when you leave.</p><span className="hub-note-rule" /><span className="hub-note-meta">PULSE / v1.0</span></section>
      </div>
      <footer className="site-footer"><span>PULSE / COGNITIVE PERFORMANCE</span><span>SHORT TESTS / CLEAR SIGNALS</span><span>LOCAL SESSION / 2026</span></footer>
    </main>
  );
}
