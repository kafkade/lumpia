import { useEffect } from "react";
import "./App.css";
import lumpiaDark from "./assets/lumpia-dark.png";
import icon from "./assets/icon.png";

const MARKETPLACE_URL =
  "https://marketplace.visualstudio.com/items?itemName=kafkade.lumpia";
const GITHUB_URL = "https://github.com/kafkade/lumpia";

const BEFORE_TEXT = `Lumpia is a VS Code extension that idiomatically rolls text to a specific line width. Unlike soft wrap, it actually reshapes your text by inserting real line breaks at the right column — respecting paragraph boundaries.`;

const AFTER_TEXT = `Lumpia is a VS Code extension that
idiomatically rolls text to a specific
line width. Unlike soft wrap, it
actually reshapes your text by inserting
real line breaks at the right column —
respecting paragraph boundaries.`;

function EditorWindow({
  filename,
  content,
  highlight,
}: {
  filename: string;
  content: string;
  highlight?: boolean;
}) {
  const lines = content.split("\n");
  return (
    <div className={`editor-window${highlight ? " editor-highlight" : ""}`}>
      <div className="editor-titlebar">
        <div className="editor-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="editor-filename">{filename}</span>
      </div>
      <div className="editor-content">
        <div className="editor-lines">
          {lines.map((_, i) => (
            <span key={i} className="line-number">
              {i + 1}
            </span>
          ))}
        </div>
        <pre className="editor-code">{content}</pre>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    document
      .querySelectorAll(".reveal")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="app">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <img src={icon} alt="" className="nav-icon" />
            <span>Lumpia</span>
          </a>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#get-started">Get Started</a>
            <a href="#support">Support</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <img
          src={lumpiaDark}
          alt="Lumpia — Text Wrapper for VS Code"
          className="hero-logo"
        />
        <h1 className="hero-title">
          Roll your text.
          <br />
          <span className="hero-accent">Perfectly.</span>
        </h1>
        <p className="hero-subtitle">
          A VS Code extension that idiomatically rolls text to a configurable
          column width — like a perfectly rolled lumpia.{" "}
          <span className="emoji">🥟</span>
        </p>
        <a
          href={MARKETPLACE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-button"
        >
          Install from Marketplace
        </a>
        <div className="scroll-hint" aria-hidden="true">
          <span className="scroll-arrow">↓</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title reveal">See It In Action</h2>
          <p className="section-subtitle reveal">
            Unlike soft wrap, Lumpia <em>actually reshapes</em> your text by
            inserting real line breaks at the right column — respecting paragraph
            boundaries and structure.
          </p>
          <div className="demo reveal">
            <EditorWindow filename="readme.md" content={BEFORE_TEXT} />
            <div className="demo-arrow" aria-hidden="true">
              <span className="arrow-icon">→</span>
              <span className="arrow-label">Alt+R</span>
            </div>
            <EditorWindow
              filename="readme.md"
              content={AFTER_TEXT}
              highlight
            />
          </div>
          <div className="feature-grid reveal">
            <div className="feature-card">
              <span className="feature-icon">✂️</span>
              <h3>Smart Rolling</h3>
              <p>
                Rolls selected text or the current line — no need to manually
                select.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📄</span>
              <h3>Paragraph-Aware</h3>
              <p>
                Preserves paragraph boundaries. Blank lines stay blank lines.
              </p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📐</span>
              <h3>Configurable Width</h3>
              <p>
                Set your column width to 72, 80, 100 — whatever your style
                demands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section id="get-started" className="section">
        <div className="section-inner">
          <h2 className="section-title reveal">Get Rolling in Seconds</h2>
          <div className="steps reveal">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Install</h3>
              <p>
                Search <strong>"Lumpia"</strong> in the VS Code Extensions panel
                or{" "}
                <a
                  href={MARKETPLACE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  install from the Marketplace
                </a>
                .
              </p>
            </div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step">
              <div className="step-number">2</div>
              <h3>Open</h3>
              <p>
                Open any file — Markdown, code comments, plain text, anything.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step">
              <div className="step-number">3</div>
              <h3>Select</h3>
              <p>
                Select text, or just place your cursor on a line. Lumpia handles
                both.
              </p>
            </div>
            <div className="step-connector" aria-hidden="true" />
            <div className="step">
              <div className="step-number">4</div>
              <h3>Roll</h3>
              <p>
                Press{" "}
                <span className="keycap-inline">Alt</span>
                <span className="key-plus-inline">+</span>
                <span className="keycap-inline">R</span>{" "}
                and watch your text get perfectly rolled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Shortcuts & Config */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title reveal">One Shortcut. One Setting.</h2>
          <div className="shortcut-config reveal">
            <div className="shortcut-panel">
              <div className="keycap-display">
                <div className="keycap">Alt</div>
                <span className="key-plus">+</span>
                <div className="keycap">R</div>
              </div>
              <p className="shortcut-desc">
                Roll selected text or the current line to your configured column
                width.
              </p>
              <div className="palette-hint">
                <span className="palette-label">Also available via</span>
                <code>
                  Ctrl+Shift+P → Lumpia: Roll Text
                </code>
              </div>
            </div>
            <div className="config-panel">
              <div className="config-editor">
                <div className="config-titlebar">
                  <span>settings.json</span>
                </div>
                <pre className="config-code">
{`{
  "lumpia.column": 80
}`}
                </pre>
              </div>
              <p className="config-desc">
                Configure your preferred column width in VS Code settings.
                Default is <strong>80</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support */}
      <section id="support" className="section">
        <div className="section-inner">
          <h2 className="section-title reveal">Support Lumpia</h2>
          <p className="section-subtitle reveal">
            Lumpia is free and open source. If it saves you time, consider
            supporting its development.
          </p>
          <div className="donate-buttons reveal">
            <a
              href="https://buymeacoffee.com/kafkade"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-btn donate-bmc"
            >
              <span className="donate-icon">☕</span>
              <span>Buy Me a Coffee</span>
            </a>
            <a
              href="https://github.com/sponsors/kafkade"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-btn donate-sponsors"
            >
              <span className="donate-icon">💜</span>
              <span>GitHub Sponsors</span>
            </a>
            <a
              href="https://patreon.com/kafkade"
              target="_blank"
              rel="noopener noreferrer"
              className="donate-btn donate-patreon"
            >
              <span className="donate-icon">🎨</span>
              <span>Patreon</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <p className="footer-brand">
            Made with <span className="emoji">🥟</span> by{" "}
            <a
              href="https://kafkade.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              kafkade
            </a>
          </p>
          <div className="footer-links">
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <span className="footer-sep">·</span>
            <a href={MARKETPLACE_URL} target="_blank" rel="noopener noreferrer">
              Marketplace
            </a>
            <span className="footer-sep">·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
