import type { ReactNode } from "react";

export default function LegalLayout(props: Readonly<{ children: ReactNode }>) {
  return <>{props.children}</>;
}
