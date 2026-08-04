// Scrolling theme-decor marquee ("chase strip"), ported from index.html.
// Renders only the actor set matching `theme`, decided in JS — the
// original used CSS [data-theme] visibility toggling instead, but that
// relies on there being exactly one data-theme in scope for the whole
// document. This app nests a per-session theme (e.g. /join once a code
// is looked up, /play, /results) inside pages that default to "pac" at
// the <html> level, so a CSS ancestor-attribute selector would see BOTH
// data-theme values in its ancestor chain and show both actor sets at
// once. Branching here avoids that entirely.
export default function ChaseStrip({ theme }: { theme: string }) {
  return (
    <div data-theme={theme} className="chase-strip">
      {theme === "pac" && (
        <>
          <div className="chase-actor pac-decor mouth-open" />
          <div className="chase-actor pac-ghost pac-ghost-red">
            <span className="eye left">
              <span className="pupil" />
            </span>
            <span className="eye right">
              <span className="pupil" />
            </span>
          </div>
          <div className="chase-actor pac-ghost pac-ghost-pink">
            <span className="eye left">
              <span className="pupil" />
            </span>
            <span className="eye right">
              <span className="pupil" />
            </span>
          </div>
          <div className="chase-actor pac-ghost pac-ghost-cyan">
            <span className="eye left">
              <span className="pupil" />
            </span>
            <span className="eye right">
              <span className="pupil" />
            </span>
          </div>
        </>
      )}

      {theme === "blocks" && (
        <>
          <div className="chase-actor tetro-piece tetro-i" style={{ animationDelay: "-4s" }}>
            <span className="cell" /><span className="cell" /><span className="cell" /><span className="cell" />
          </div>
          <div className="chase-actor tetro-piece tetro-o" style={{ animationDelay: "-3.2s" }}>
            <span className="cell" /><span className="cell" /><span className="cell" /><span className="cell" />
          </div>
          <div className="chase-actor tetro-piece tetro-t" style={{ animationDelay: "-2.4s" }}>
            <span className="cell" /><span className="cell" /><span className="cell" /><span className="cell" />
          </div>
          <div className="chase-actor tetro-piece tetro-l" style={{ animationDelay: "-1.6s" }}>
            <span className="cell" /><span className="cell" /><span className="cell" /><span className="cell" />
          </div>
        </>
      )}

      {theme === "plumber" && (
        <>
          <div className="chase-actor deco-pipe" style={{ animationDelay: "-4s" }}>
            <span className="rim" /><span className="body" />
          </div>
          <div className="chase-actor deco-mushroom" style={{ animationDelay: "-3.2s" }}>
            <span className="cap" /><span className="spot l" /><span className="spot r" /><span className="stem" />
          </div>
          <div className="chase-actor deco-mushroom alt" style={{ animationDelay: "-2.4s" }}>
            <span className="cap" /><span className="spot l" /><span className="spot r" /><span className="stem" />
          </div>
          <div className="chase-actor goomba" style={{ animationDelay: "-1.6s" }}>
            <span className="cap" /><span className="foot left" /><span className="foot right" /><span className="eyebrow left" /><span className="eyebrow right" />
          </div>
        </>
      )}
    </div>
  );
}
