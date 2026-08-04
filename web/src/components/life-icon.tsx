// Pure-CSS dog face — no image asset, ported from index.html's .life-icon.
export default function LifeIcon({ lost }: { lost: boolean }) {
  return (
    <span className={`life-icon${lost ? " lost" : ""}`}>
      <span className="lf-ear l" />
      <span className="lf-ear r" />
      <span className="lf-head" />
      <span className="lf-eye l" />
      <span className="lf-eye r" />
      <span className="lf-nose" />
    </span>
  );
}
