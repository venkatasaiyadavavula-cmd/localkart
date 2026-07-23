import { Mail, Phone } from 'lucide-react';

export function SellerSupportContact() {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4 text-sm">
      <a
        href="mailto:support@localkart.com"
        className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
      >
        <Mail className="h-4 w-4" />
        support@localkart.com
      </a>
      <a
        href="tel:+919999999999"
        className="inline-flex items-center justify-center gap-2 text-primary hover:underline"
      >
        <Phone className="h-4 w-4" />
        Platform support
      </a>
    </div>
  );
}
