import type { Metadata } from "next";
import { OutreachDashboard } from "./outreach-dashboard";

export const metadata: Metadata = { title: "Outreach" };

export default function AdminOutreachPage() {
  return <OutreachDashboard />;
}
