import { OwnbasePageLoader } from "@/components/OwnbasePageLoader";

/** Shown while App Router segments outside `/dashboard` resolve (marketing, auth, etc.). */
export default function RootLoading() {
  return (
    <OwnbasePageLoader
      minHeightClass="min-h-dvh"
      className="min-h-dvh bg-background"
    />
  );
}
