// Shared table shell: a sticky, blurred header row inside a bounded scroll
// container, so the header (and the page's Topbar above it) never scroll away
// with the rows. Callers pass `columns` for the header and `<tr>` elements as
// children for the body — deliberately not a fully data-driven grid, since
// each list in this app renders very different row content (avatars, inline
// controls, badges, etc).
export default function Table({ columns, children, maxHeight = 'max-h-[70vh]', className = '' }) {
  return (
    <div className={`overflow-y-auto ${maxHeight} rounded-2xl border border-white/10 ${className}`}>
      <table className="w-full text-sm border-collapse">
        <thead className="sticky top-0 z-10">
          <tr className="bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
            {columns.map((col) => (
              <th
                key={col.key || col.label}
                className={`text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap ${col.className || ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}
