"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export function FloatingAiButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link href="/chat">
        <Button
          size="icon"
          className="w-16 h-16 rounded-full shadow-lg bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center"
        >
          <Image
            src="/images/ai-icon.png"
            alt="AI"
            width={32}
            height={32}
          />
        </Button>
      </Link>
    </div>
  );
} 