import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
      <div className="p-6 rounded-2xl bg-secondary/50 border border-border max-w-sm space-y-4 shadow-lg">
        <Compass className="w-10 h-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Page Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested route could not be found in your personal command center.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
