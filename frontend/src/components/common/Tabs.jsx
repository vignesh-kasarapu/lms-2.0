import { useState } from 'react';

export default function Tabs({ tabs, initialActiveKey }) {
  const [active, setActive] = useState(initialActiveKey || tabs[0].key);
  const ActiveContent = tabs.find((t) => t.key === active)?.content;

  return (
    <div>
      <div className="glass-panel-admin !p-1.5 mb-6 overflow-x-auto max-w-full scrollbar-none flex items-center gap-1.5">
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-admin-btn font-bold scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div>{ActiveContent}</div>
    </div>
  );
}
