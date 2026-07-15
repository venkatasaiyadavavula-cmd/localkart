'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { buildLoginUrl, buildRegisterUrl, SELLER_ONBOARDING_PATH } from '@/lib/auth-routes';

const footerLinks = {
  company: [{ label: 'About Us', href: '/about' }],
  support: [
    { label: 'Help Center', href: 'mailto:support@localkart.com', external: true },
    { label: 'Contact Us', href: 'mailto:support@localkart.com', external: true },
    { label: 'Shipping Policy', href: '/terms' },
    { label: 'Returns & Refunds', href: '/terms' },
  ],
  seller: [
    { label: 'Become a Seller', href: buildRegisterUrl({ intent: 'seller', redirect: SELLER_ONBOARDING_PATH }) },
    { label: 'Seller Login', href: buildLoginUrl({ intent: 'seller', redirect: '/dashboard' }) },
    { label: 'Commission Structure', href: buildLoginUrl({ intent: 'seller', redirect: '/dashboard/commission' }) },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/localkart', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/localkart', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/localkart', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/localkart', label: 'YouTube' },
];

function FooterLink({ link }: { link: { label: string; href: string; external?: boolean } }) {
  const className = 'text-sm text-muted-foreground hover:text-primary';
  if (link.external || link.href.startsWith('mailto:')) {
    return <a href={link.href} className={className}>{link.label}</a>;
  }
  return <Link href={link.href} className={className}>{link.label}</Link>;
}

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('Thanks for subscribing! We will keep you updated.');
    setNewsletterEmail('');
  };

  return (
    <footer className="border-t bg-muted/20 pb-20 lg:pb-0">
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="LocalKart" width={140} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              Shop from trusted local stores in Kadapa. Same-day delivery with Cash on Delivery — pay when your order arrives.
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Kadapa, Andhra Pradesh, India</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href="mailto:support@localkart.com" className="hover:text-primary">
                  support@localkart.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href="tel:+919876543210" className="hover:text-primary">
                  +91 98765 43210
                </a>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium">Subscribe to our newsletter</p>
              <form className="mt-2 flex gap-2" onSubmit={handleNewsletter}>
                <Input
                  type="email"
                  placeholder="Your email"
                  className="max-w-xs bg-background"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <Button type="submit" size="sm">Subscribe</Button>
              </form>
            </div>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Sell</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.seller.map((link) => (
                <li key={link.label}><FooterLink link={link} /></li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            © {new Date().getFullYear()} LocalKart. All rights reserved.
          </p>
          <div className="flex gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <div className="flex gap-6">
            {footerLinks.legal.map((link) => (
              <Link key={link.label} href={link.href} className="text-xs text-muted-foreground hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
