"use client";

import { Menu, Search, SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ModeToggle } from "./ModeToggle";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { IoSearch } from "react-icons/io5";

interface NavbarProps {
  title?: string;
  onToggleSearch?: () => void;
}

export function Navbar({ title = "Al Quran", onToggleSearch }: NavbarProps) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Menu className="h-6 w-6 cursor-pointer" />
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  {/* Navigasi atau opsi lain bisa ditempatkan di sini */}
                  Halaman navigasi akan muncul di sini.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {isHomePage && onToggleSearch ? (
            <IoSearch 
              className="h-6 w-6 cursor-pointer" 
              onClick={onToggleSearch}
            />
          ) : (
            <Button variant="ghost" size="icon">
              <SlidersHorizontal className="h-6 w-6" />
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
} 