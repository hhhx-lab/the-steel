type Option<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="grid rounded-[8px] border border-line bg-white p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`min-h-10 rounded-[6px] px-3 text-sm font-semibold transition ${
            value === option.value ? "bg-ink text-acid" : "text-muted"
          }`}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
