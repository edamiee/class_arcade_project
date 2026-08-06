// Simple stroke icons for the dashboard nav cards, matching the
// currentColor pattern already used by SoundToggleButton — lighter-weight
// than the hand-built div/CSS art (mascot, life-icon, joystick) since
// there are five of these and each just needs to read as a distinct glyph.
function IconBase({ children }: { children: React.ReactNode }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function BookIcon() {
  return (
    <IconBase>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    </IconBase>
  );
}

export function ClockIcon() {
  return (
    <IconBase>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </IconBase>
  );
}

export function PeopleIcon() {
  return (
    <IconBase>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="18" cy="9" r="2.4" />
      <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
    </IconBase>
  );
}

export function ShieldIcon() {
  return (
    <IconBase>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}
