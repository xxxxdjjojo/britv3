import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout(
  props: Readonly<{
    children: React.ReactNode;
  }>,
) {
  return <DashboardShell>{props.children}</DashboardShell>;
}
