export function CinematicBackground() {
  return (
    <div className="cinematic-background" aria-hidden="true">
      <div className="cinematic-mesh" />
      <div className="cinematic-particles">
        {Array.from({ length: 14 }, (_, i) => <span key={i} />)}
      </div>
    </div>
  );
}