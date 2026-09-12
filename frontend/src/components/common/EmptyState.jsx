export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl glass-panel flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-aurora-violet" strokeWidth={1.75} />
        </div>
      )}
      <p className="text-ink-200 font-medium">{title}</p>
      {description && <p className="text-ink-500 text-sm mt-1 max-w-sm">{description}</p>}
    </div>
  );
}
