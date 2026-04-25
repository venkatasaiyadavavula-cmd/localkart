import { MapPin, User } from 'lucide-react';

export function FounderSection() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 to-accent/10 p-[2px] shadow-soft-xl">
      <div className="rounded-3xl bg-background p-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <User className="h-10 w-10 text-primary" />
        </div>
        <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
          Venkata Sai Yadav
        </h2>
        <p className="text-primary font-medium">Founder & Developer</p>
        <div className="mt-2 flex items-center justify-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Kadapa, Andhra Pradesh, India</span>
        </div>
        <p className="mt-4 text-muted-foreground max-w-md mx-auto">
          Building LocalKart to empower local shop owners and connect them with nearby customers.
          Our mission is to make hyperlocal commerce accessible, fast, and reliable.
        </p>
      </div>
    </div>
  );
}
