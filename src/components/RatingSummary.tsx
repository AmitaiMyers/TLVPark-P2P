import { Star } from "lucide-react";
import { formatAverageRating } from "@/lib/format";
import { styles } from "./ui";

/** "★ 4.5 (12)", or a "New" badge for spots without reviews yet. */
export function RatingSummary({ ratings, newLabel }: { ratings: number[]; newLabel: string }) {
  const average = formatAverageRating(ratings);
  if (average === null) return <span className={styles.badge}>{newLabel}</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium">
      <Star size={14} className="fill-amber-400 text-amber-400" aria-hidden />
      {average}
      <span className={styles.muted}>({ratings.length})</span>
    </span>
  );
}

/** Five stars with the first `rating` filled; read as "4/5" by screen readers. */
export function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex" role="img" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          aria-hidden
          className={index < rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"}
        />
      ))}
    </span>
  );
}
