// Scrolling theme-decor marquee ("chase strip"), ported from index.html.
// Wrap in a div with data-theme={theme} so the CSS var palette and the
// [data-theme] .theme-decor-x visibility rules in globals.css pick the
// right actor set.
export default function ChaseStrip({ theme }: { theme: string }) {
  return (
    <div data-theme={theme} className="chase-strip">
      <div className="theme-decor theme-decor-pac">
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
      </div>
      <div className="theme-decor theme-decor-blocks">
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
      </div>
      <div className="theme-decor theme-decor-plumber">
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
      </div>
    </div>
  );
}
