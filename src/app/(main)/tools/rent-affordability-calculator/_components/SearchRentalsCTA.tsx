import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

type Props = Readonly<{
  /** Upper rent bound to seed the search; rounded to a whole pound */
  maxPrice: number;
}>;

export function SearchRentalsCTA({ maxPrice }: Props) {
  const href =
    maxPrice > 0
      ? `/search?type=rent&maxPrice=${Math.round(maxPrice)}`
      : "/search?type=rent";

  return (
    <Button asChild className="w-full" size="lg">
      <Link href={href}>
        <Search className="mr-2 size-4" />
        Search rentals in your budget
      </Link>
    </Button>
  );
}
