export type ReportScheduleInitial = {
  enabled: boolean;
  cadence: "weekly" | "monthly";
  destination_email: string;
  last_sent_at: string | null;
};
