"use client";

import dynamic from "next/dynamic";

const PullToRefresh = dynamic(
  () => import("./PullToRefresh").then((m) => m.PullToRefresh),
  { ssr: false },
);

export function PullToRefreshWrapper() {
  return <PullToRefresh />;
}
