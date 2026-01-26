export default function StatPill({
  label,
  value,
  onClick,
  tone = 'default',
}: {
  label: string;
  value: number | string;
  onClick?: () => void;
  tone?: 'default' | 'danger' | 'warning' | 'success';
}) {
  const clickable = typeof onClick === 'function';

  const valueClass =
    tone === 'danger'
      ? 'text-[hsl(var(--danger))]'
      : tone === 'warning'
        ? 'text-[hsl(var(--warning))]'
        : tone === 'success'
          ? 'text-[hsl(var(--success))]'
          : 'text-[hsl(var(--fg))]';

  const inner = (
    <>
      <div className="text-[11px] font-semibold uppercase tracking-wider">{label}</div>
      <div className={['mt-1 text-2xl font-semibold tracking-tight', valueClass].join(' ')}>
        {value}
      </div>
    </>
  );

  if (!clickable) {
    return (
      <div className="text-left rounded-[18px] px-4 py-3 border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] cursor-default">
        {inner}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'text-left rounded-[18px] border px-4 py-3 transition-colors',
        'border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))]',
        'cursor-pointer hover:bg-[hsl(var(--surface-2))]',
      ].join(' ')}
    >
      {inner}
    </button>
  );
}
