import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Shared modal shell — extracted from the sign-out confirmation dialog pattern
// (Topbar.jsx) so every "click a row to see details" screen reuses the same
// portal/backdrop/Escape-key/click-outside behavior instead of re-implementing it.
export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        ref={cardRef}
        className={`glass-panel p-6 rounded-3xl w-full ${maxWidth} border border-frost/15 bg-ink-950/95 text-ink-100 shadow-2xl max-h-[85vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-frost/10">
            <h3 className="font-display font-extrabold text-lg text-ink-50">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-ink-400 hover:text-ink-50 hover:bg-frost/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
