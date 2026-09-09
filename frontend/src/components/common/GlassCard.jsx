export default function GlassCard({ children, className = '', strong = false, ...props }) {
  return (
    <div className={`${strong ? 'glass-panel-strong' : 'glass-panel'} p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
