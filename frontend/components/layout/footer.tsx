'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Shipping Policy', href: '/shipping' },
    { label: 'Returns & Refunds', href: '/returns' },
  ],
  seller: [
    { label: 'Sell on LocalKart', href: '/seller-onboarding' },
    { label: 'Seller Dashboard', href: '/seller/dashboard' },
    { label: 'Seller Policy', href: '/seller-policy' },
    { label: 'Commission Structure', href: '/commissions' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/localkart', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/localkart', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/localkart', label: 'Instagram' },
  { icon: Youtube, href: 'https://youtube.com/localkart', label: 'YouTube' },
];

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container py-8 md:py-12">
        {/* Top Section */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <Image src="/logo.svg" alt="LocalKart" width={140} height={40} className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-md">
              Shop from trusted local stores in your neighborhood. Same-day delivery from shops in Kadapa and across Andhra Pradesh.
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

            {/* Newsletter */}
            <div className="mt-6">
              <p className="text-sm font-medium">Subscribe to our newsletter</p>
              <form className="mt-2 flex gap-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="max-w-xs bg-background"
                />
                <Button size="sm">Subscribe</Button>
              </form>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider">Sell</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.seller.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
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
              <Link key={link.href} href={link.href} className="text-xs text-muted-foreground hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
