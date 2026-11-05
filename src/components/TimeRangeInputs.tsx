import { SLOT_MS } from "@/lib/time";
import { styles } from "./ui";

type TimeRangeInputsProps = {
  startLabel: string;
  endLabel: string;
  /** datetime-local values in Jerusalem time ("2026-11-10T14:30"). */
  defaultStart: string;
  defaultEnd: string;
  /** Earliest selectable value, or null for no lower bound. */
  min: string | null;
  required: boolean;
  onChange?: (field: "start" | "end", value: string) => void;
};

/**
 * Start/end pickers shared by search, checkout and host exceptions.
 * step = 30 minutes: browsers then reject times off the half-hour grid.
 */
export function TimeRangeInputs({ startLabel, endLabel, defaultStart, defaultEnd, min, required, onChange }: TimeRangeInputsProps) {
  const stepSeconds = SLOT_MS / 1000;
  const fields = [
    { name: "start" as const, label: startLabel, defaultValue: defaultStart },
    { name: "end" as const, label: endLabel, defaultValue: defaultEnd },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <label key={field.name} className={styles.label}>
          {field.label}
          <input
            type="datetime-local"
            name={field.name}
            defaultValue={field.defaultValue}
            min={min ?? undefined}
            step={stepSeconds}
            required={required}
            className={styles.input}
            onChange={onChange === undefined ? undefined : (event) => onChange(field.name, event.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
