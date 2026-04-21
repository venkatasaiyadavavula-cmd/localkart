'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  User,
  MapPin,
  Menu,
  X,
  ChevronDown,
  Store,
  Package,
  Heart,
  LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { useCartStore } from '@/store/cart-store';
import { useLocationStore } from '@/store/location-store';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Groceries', href: '/browse/groceries' },
  { label: 'Fashion', href: '/browse/fashion' },
  { label: 'Electronics', href: '/browse/electronics' },
  { label: 'Home', href: '/browse/home-essentials' },
  { label: 'Beauty', href: '/browse/beauty' },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { totalItems } = useCartStore();
  const { location } = useLocationStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery)}`);
      setShowMobileSearch(false);
    }
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-300',
          isScrolled ? 'bg-background/95 backdrop-blur-xl shadow-soft-sm' : 'bg-background'
        )}
      >
        <div className="container flex h-16 items-center justify-between gap-4 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="LocalKart" width={120} height={40} className="h-8 w-auto md:h-10" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex lg:items-center lg:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname.startsWith(item.href) ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="hidden flex-1 max-w-md lg:block"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products, shops..."
                className="pl-10 pr-4 bg-muted/50 border-transparent focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Location */}
            <Button variant="ghost" size="sm" className="hidden md:flex" asChild>
              <Link href="/location">
                <MapPin className="mr-1 h-4 w-4" />
                <span className="max-w-[100px] truncate">
                  {location ? 'Kadapa' : 'Set Location'}
                </span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </Link>
            </Button>

            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">
                      <Package className="mr-2 h-4 w-4" /> My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">
                      <Heart className="mr-2 h-4 w-4" /> Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'seller' && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller/dashboard">
                        <Store className="mr-2 h-4 w-4" /> Seller Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <Store className="mr-2 h-4 w-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                    {totalItems}
                  </Badge>
                )}
              </Link>
            </Button>

            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/location">
                      <MapPin className="mr-2 h-4 w-4" />
                      {location ? 'Kadapa' : 'Set Location'}
                    </Link>
                  </Button>
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-30 border-b bg-background p-4 lg:hidden"
          >
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="text"
                placeholder="Search..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <Button type="submit">Search</Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSearch(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
