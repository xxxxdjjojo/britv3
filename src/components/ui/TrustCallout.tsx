import { cn } from "@/lib/utils";

export function TrustCallout(
  props: Readonly<{
    title: string;
    children: React.ReactNode;
    variant?: "info" | "tip" | "success";
    className?: string;
  }>,
) {
  const bgClass = {
    info: "bg-brand-primary",
    tip: "bg-brand-primary/90",
    success: "bg-emerald-700",
  }[props.variant ?? "info"];

  return (
    <div className={cn("rounded-xl p-5 text-white", bgClass, props.className)}>
      <h4 className="mb-2 font-heading text-sm font-bold">{props.title}</h4>
      <div className="text-xs leading-relaxed text-white/80">{props.children}</div>
    </div>
  );
}
