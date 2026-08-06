// Pure-CSS arcade joystick — no image asset, matches the life-icon/mascot
// pattern of hand-built pixel-ish art via divs instead of an emoji glyph
// (which renders inconsistently across OS/browser fonts).
export default function JoystickIcon() {
  return (
    <span className="joystick-icon" aria-hidden="true">
      <span className="js-base" />
      <span className="js-shaft" />
      <span className="js-ball" />
    </span>
  );
}
