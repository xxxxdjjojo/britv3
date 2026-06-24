import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
  /** Show a leading £ symbol */
  money?: boolean;
  suffix?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}>;

export function CurrencyField({
  label,
  value,
  onChange,
  money = false,
  suffix,
  hint,
  min = 0,
  max = 99_999_999,
  step = 1,
  error,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="relative">
        {money && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            £
          </span>
        )}
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))}
          className={`${money ? "pl-7" : ""} ${suffix ? "pr-8" : ""}`}
          min={min}
          max={max}
          step={step}
          aria-label={label}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
