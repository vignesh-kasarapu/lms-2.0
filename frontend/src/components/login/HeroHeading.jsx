export default function HeroHeading() {
  return (
    <h1
      className="font-display font-extrabold text-premium-text"
      style={{
        fontSize: 'clamp(2.5rem, 4.2vw, 4.1rem)',
        lineHeight: 1.05,
        letterSpacing: '-0.03em',
      }}
    >
      A better way to
      <br />
      <span
        style={{
          background: 'linear-gradient(90deg, #8B5CF6, #6366F1, #22D3EE)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        manage your leave
      </span>
    </h1>
  );
}
