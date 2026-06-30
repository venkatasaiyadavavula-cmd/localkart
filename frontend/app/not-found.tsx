// 'use client';  <-- ఇది లేకుండా చూడండి, సర్వర్ కాంపోనెంట్ అవుతుంది

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PackageSearch } from "lucide-react";

// ఈ ఎక్స్‌పోర్ట్ ఈ పేజీ స్టాటిక్‌గా జనరేట్ కాకుండా, రిక్వెస్ట్ టైమ్ లో రెండర్ అయ్యేలా చేస్తుంది
export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <PackageSearch className="h-16 w-16 text-muted-foreground" />
      <h2 className="mt-4 text-2xl font-bold">Page Not Found</h2>
      <p className="mt-2 text-muted-foreground">Could not find requested resource</p>
      <Button asChild className="mt-6">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
