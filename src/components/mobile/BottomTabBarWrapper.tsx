"use client";

import dynamic from "next/dynamic";

const BottomTabBar = dynamic(
  () => import("./BottomTabBar").then((m) => m.BottomTabBar),
  { ssr: false },
);

export function BottomTabBarWrapper() {
  return <BottomTabBar />;
}
