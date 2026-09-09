export function PrimaryButton({ children, className = '', ...props }) {
  return <button className={`aurora-btn ${className}`} {...props}>{children}</button>;
}

export function GhostButton({ children, className = '', ...props }) {
  return <button className={`ghost-btn ${className}`} {...props}>{children}</button>;
}
