import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface LastReadCardProps {
  surahName: string;
  verseInfo: string;
  surahNumber: number;
}

export function LastReadCard({
  surahName,
  verseInfo,
  surahNumber,
}: LastReadCardProps) {
  return (
    <Link href={`/surah/${surahNumber}`}>
      <Card className="min-w-[120px] h-20 flex items-center justify-center bg-card border-border text-foreground rounded-md p-2 shadow-sm">
        <CardContent className="p-0 text-center flex flex-col justify-center items-center gap-1">
          <CardTitle className="text-sm font-semibold leading-none">{surahName}</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-none">{verseInfo}</CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
} 