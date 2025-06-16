"use client";

import { usePathname } from "next/navigation";
import { BottomNavigationBar } from "./BottomNavigationBar";
import { FloatingAiButton } from "./FloatingAiButton";

export function PageLayoutComponents() {
  const pathname = usePathname();

  const hideComponents = pathname === "/chat";

  return (
    <>
      {!hideComponents && <BottomNavigationBar />}
      {!hideComponents && <FloatingAiButton />}
    </>
  );
} 