import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Heart, Users, Store, Truck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'LocalKart empowers local shop owners in Kadapa and connects them with nearby customers through same-day delivery and Cash on Delivery.',
};

const values = [
  {
    icon: Store,
    title: 'Support Local Businesses',
    description:
      'Every order on LocalKart goes to a real shop in your neighbourhood — helping Kadapa traders grow online without losing their local identity.',
  },
  {
    icon: Truck,
    title: 'Fast Hyperlocal Delivery',
    description:
      'We focus on same-day delivery from shops near you, so fresh groceries, fashion, and essentials reach your doorstep quickly.',
  },
  {
    icon: Banknote,
    title: 'Cash on Delivery',
    description:
      'We built LocalKart around COD — pay when your order arrives. Simple, trusted, and familiar for every customer in our community.',
  },
  {
    icon: Users,
    title: 'Community First',
    description:
      'LocalKart is built for Kadapa and surrounding areas — connecting families with the shops they already know and trust.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Hero */}
      <section className="container py-12 md:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Kadapa, Andhra Pradesh
          </span>
          <h1
            className="mt-6 text-4xl font-black tracking-tight md:text-5xl"
            style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}
          >
            Empowering Local Shops,
            <span className="text-primary"> One Order at a Time</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            LocalKart is a hyperlocal marketplace built to help small businesses in Kadapa sell online
            and deliver to customers in their city — with same-day delivery and Cash on Delivery.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container pb-12">
        <div className="grid gap-6 md:grid-cols-2">
          {values.map((item) => (
            <Card key={item.title} className="border-primary/10 shadow-soft">
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">{item.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="container pb-12">
        <div className="relative overflow-hidden rounded-3xl border bg-card p-8 md:p-12 shadow-soft-xl">
          <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-3xl font-black text-primary">
              VS
            </div>
            <h2
              className="mt-6 text-3xl font-black"
              style={{ fontFamily: 'var(--font-display, Syne, sans-serif)' }}
            >
              Venkata Sai Yadav
            </h2>
            <p className="mt-1 text-primary font-semibold">Founder & Developer</p>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Kadapa, Andhra Pradesh, India</span>
            </div>
            <p className="mt-6 text-muted-foreground leading-relaxed">
              I started LocalKart because I saw local shop owners in Kadapa struggling to reach customers
              beyond their street — and families wanting the convenience of online shopping without losing
              the trust of buying from shops they know. LocalKart bridges that gap: a platform built for
              our city, by someone who understands our community.
            </p>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our mission is simple — make hyperlocal commerce accessible, fast, and reliable for every
              shop owner and every family in Kadapa and beyond.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-16 text-center">
        <div className="mx-auto max-w-xl">
          <Heart className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-4 text-2xl font-bold">Join the LocalKart community</h2>
          <p className="mt-2 text-muted-foreground">
            Whether you want to shop from local stores or grow your business online — we are here for you.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild size="lg">
              <Link href="/browse">Start Shopping</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register?intent=seller&redirect=%2Fseller-onboarding">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
