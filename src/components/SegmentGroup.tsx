export interface SegmentGroupProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-zinc-300">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              value === option
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
            aria-pressed={value === option}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
