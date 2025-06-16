"use client";

import Link from "next/link";
import { HomeIcon, Bookmark, User, Settings } from "lucide-react";

export function BottomNavigationBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link href="/" className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-primary">
          <HomeIcon className="h-5 w-5" />
          Home
        </Link>
        <Link href="/bookmark" className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <Bookmark className="h-5 w-5" />
          Bookmark
        </Link>
        <Link href="/profile" className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <User className="h-5 w-5" />
          Profile
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </div>
  );
} 