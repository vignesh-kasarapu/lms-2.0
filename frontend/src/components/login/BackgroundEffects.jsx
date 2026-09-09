/**
 * Full-viewport ambient background for the login page.
 * Pure CSS: dark navy base + several very soft, large blurred radial
 * light sources (cyan top-right, purple bottom-left, subtle blue-violet
 * center-right, purple/cyan bottom-right) plus a couple of low-opacity
 * diagonal light streaks for depth. Nothing here should read as a
 * visible "blob" — everything is heavily blurred and low-opacity.
 */
export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-premium-bg0" aria-hidden="true">
      {/* base gradient wash between the premium bg stops */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, #050816 0%, #070B18 40%, #080C1C 70%, #0B1028 100%)',
        }}
      />

      {/* top-right cyan atmospheric glow */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] motion-safe:animate-ambient-drift-slow"
        style={{
          background:
            'radial-gradient(circle at 100% 0%, rgba(34,211,238,0.30), rgba(34,211,238,0.08) 25%, transparent 55%)',
          filter: 'blur(60px)',
        }}
      />

      {/* bottom-left purple/violet glow behind the dashboard preview */}
      <div
        className="absolute -bottom-[15%] -left-[10%] w-[75vw] h-[75vw] max-w-[950px] max-h-[950px] motion-safe:animate-ambient-drift"
        style={{
          background: 'radial-gradient(circle at 10% 90%, rgba(109,76,255,0.25), transparent 45%)',
          filter: 'blur(70px)',
        }}
      />

      {/* subtle blue-violet glow behind the login card */}
      <div
        className="absolute top-1/3 right-[8%] w-[42vw] h-[42vw] max-w-[560px] max-h-[560px] motion-safe:animate-ambient-drift-slow"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.16), transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* bottom-right purple/cyan glow */}
      <div
        className="absolute -bottom-[10%] -right-[5%] w-[45vw] h-[45vw] max-w-[600px] max-h-[600px] motion-safe:animate-ambient-drift"
        style={{
          background: 'radial-gradient(circle, rgba(139,92,246,0.14), rgba(34,211,238,0.06) 50%, transparent 70%)',
          filter: 'blur(75px)',
        }}
      />

      {/* faint diagonal light streaks — decoration only, never competing with content */}
      <div
        className="absolute top-[-5%] left-[20%] w-[140%] h-[220px] opacity-[0.07]"
        style={{
          background: 'linear-gradient(100deg, transparent, #6D4AFF, transparent)',
          transform: 'rotate(-8deg)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute bottom-[10%] left-[-10%] w-[130%] h-[180px] opacity-[0.06]"
        style={{
          background: 'linear-gradient(100deg, transparent, #22D3EE, transparent)',
          transform: 'rotate(6deg)',
          filter: 'blur(45px)',
        }}
      />

      {/* very subtle vignette so edges recede */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 100% at 50% 20%, transparent 55%, rgba(2,3,10,0.55) 100%)' }}
      />
    </div>
  );
}
