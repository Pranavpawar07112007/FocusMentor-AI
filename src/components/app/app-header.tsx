'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import {
  Settings,
  LogOut,
  Menu,
  History,
  LayoutDashboard,
  Award,
  Crosshair,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { initiateSignOut } from '@/firebase/non-blocking-login';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  pageId: 'focus' | 'history' | 'dashboard' | 'achievements' | 'settings';
};

const navLinks: NavLink[] = [
  {
    href: '/',
    label: 'Focus',
    icon: <Crosshair className="h-4 w-4" />,
    pageId: 'focus',
  },
  {
    href: '/history',
    label: 'History',
    icon: <History className="h-4 w-4" />,
    pageId: 'history',
  },
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    pageId: 'dashboard',
  },
  {
    href: '/gamification',
    label: 'Achievements',
    icon: <Award className="h-4 w-4" />,
    pageId: 'achievements',
  },
];

type AppHeaderProps = {
  activePage: NavLink['pageId'];
  children?: React.ReactNode;
};

export function AppHeader({ activePage, children }: AppHeaderProps) {
  const { user, auth } = useFirebase();
  const router = useRouter();
  const [isHeaderHidden, setHeaderHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Logic to hide/show header
      if (currentScrollY > 100 && currentScrollY > lastScrollY.current) {
        setHeaderHidden(true);
      } else {
        setHeaderHidden(false);
      }
      lastScrollY.current = currentScrollY;
      
      // Logic to change header shape
      setIsScrolled(currentScrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    if (auth) {
      initiateSignOut(auth);
      router.push('/login');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <header
      className={cn(
        'fixed z-50 flex h-16 items-center justify-between px-4 backdrop-blur-lg shadow-xl transition-all duration-300 sm:px-6 bg-background/80',
        {
          '-translate-y-[120%]': isHeaderHidden,
          'top-0 left-0 right-0 rounded-none border-b border-border/20': isScrolled,
          'top-4 left-4 right-4 rounded-xl border border-border/20': !isScrolled,
        }
      )}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <SheetClose key={link.href} asChild>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                        activePage === link.pageId && 'bg-accent text-primary'
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
        <h1 className="font-headline text-lg font-bold text-primary sm:text-xl">
          <Link href="/">FocusMentor AI</Link>
        </h1>
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.href}
              asChild
              variant="ghost"
              className={cn(
                'text-sm',
                activePage === link.pageId && 'bg-accent'
              )}
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {children}

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user.photoURL ?? ''}
                  alt={user.displayName ?? 'U'}
                />
                <AvatarFallback>
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <p>Signed in as</p>
              <p className="text-sm font-normal text-muted-foreground">
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
