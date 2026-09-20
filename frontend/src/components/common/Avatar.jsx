import { useState } from 'react';
import { avatarUrl } from '../../api/employees';

// Falls back to initials whenever there's no uploaded photo, or the stored file 404s
// (e.g. it was deleted on disk after the DB row was written).
export default function Avatar({ employee, size = 36, fontSize = 14, className = '' }) {
  const [failed, setFailed] = useState(false);
  const initials = employee?.full_name?.slice(0, 2).toUpperCase() || '??';
  const showImage = employee?.avatar_path && !failed;

  if (showImage) {
    return (
      <img
        src={avatarUrl(employee.employee_id)}
        alt={employee.full_name}
        onError={() => setFailed(true)}
        className={className}
        style={{ width: size, height: size, borderRadius: 'var(--radius-pill)', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }

  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize, background: 'var(--color-accent)', color: 'var(--color-accent-contrast)' }}
    >
      {initials}
    </span>
  );
}
