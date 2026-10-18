import type { LabConfig } from "@/feature/lab/types";

export const labConfig: LabConfig = {
  sheetsWebAppUrl: process.env.NEXT_PUBLIC_SHEETS_WEB_APP_URL || "",
  syncToken: process.env.NEXT_PUBLIC_SYNC_TOKEN || "",
  googleSheetUrl: process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL || "",
  storageKey: "english-strandlab-v1",
  sessionModes: [
    { id: "15", label: "15 min", minutes: 15 },
    { id: "30", label: "30 min", minutes: 30 },
    { id: "45", label: "45 min", minutes: 45 },
  ],
};
