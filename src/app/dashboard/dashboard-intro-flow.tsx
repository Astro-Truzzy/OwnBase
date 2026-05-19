"use client";

import { DashboardWalkthrough } from "./dashboard-walkthrough";

interface DashboardIntroFlowProps {
  displayName: string;
}

export function DashboardIntroFlow({ displayName }: DashboardIntroFlowProps) {
  return <DashboardWalkthrough displayName={displayName} />;
}
