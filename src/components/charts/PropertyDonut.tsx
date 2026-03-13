"use client";

type Segment = Readonly<{
  label: string;
  value: number;
  color: string;
}>;

type PropertyDonutProps = Readonly<{
  segments?: Segment[];
  total?: number;
  className?: string;
}>;

const DEFAULT_SEGMENTS: Segment[] = [
  { label: "Flats", value: 45, color: "#1B4D3E" },
  { label: "Terraced", value: 25, color: "#2D7A5F" },
  { label: "Semi", value: 20, color: "#D4A853" },
  { label: "Detached", value: 10, color: "#E2E2E8" },
];

function buildArcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

export function PropertyDonut({ segments = DEFAULT_SEGMENTS, total = 1240, className }: PropertyDonutProps) {
  const cx = 64;
  const cy = 64;
  const outerR = 54;
  const innerR = 36;

  const totalValue = segments.reduce((acc, s) => acc + s.value, 0);
  const arcs = segments.reduce<Array<{ label: string; value: number; color: string; start: number; end: number }>>(
    (acc, seg) => {
      const start = acc.length > 0 ? acc[acc.length - 1]!.end : 0;
      const end = start + (seg.value / totalValue) * 360;
      return [...acc, { ...seg, start, end }];
    },
    []
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          <svg width={128} height={128} viewBox="0 0 128 128">
            {arcs.map((arc) => (
              <path
                key={arc.label}
                d={`${buildArcPath(cx, cy, outerR, arc.start, arc.end)} L ${cx + innerR * Math.cos(((arc.end - 90) * Math.PI) / 180)} ${cy + innerR * Math.sin(((arc.end - 90) * Math.PI) / 180)} A ${innerR} ${innerR} 0 ${arc.end - arc.start > 180 ? 1 : 0} 0 ${cx + innerR * Math.cos(((arc.start - 90) * Math.PI) / 180)} ${cy + innerR * Math.sin(((arc.start - 90) * Math.PI) / 180)} Z`}
                fill={arc.color}
              />
            ))}
            <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs" style={{ fontSize: 14, fontWeight: 900, fill: "#1B4D3E" }}>
              {total.toLocaleString()}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 9, fill: "#9E9EAB" }}>
              units
            </text>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: seg.color }} />
              <span className="text-xs text-neutral-600">
                {seg.label} <span className="font-bold text-neutral-900">{seg.value}%</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
