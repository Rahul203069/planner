import {
  BookOpen,
  CandyOff,
  Droplets,
  Footprints,
  MoonStar,
  Utensils,
} from "lucide-react";

type HabitPresetIconProps = {
  icon: string;
  className?: string;
};

export function HabitPresetIcon({
  icon,
  className,
}: HabitPresetIconProps) {
  const sharedClassName = className ?? "size-5";

  switch (icon) {
    case "moon":
      return <MoonStar className={sharedClassName} />;
    case "utensils":
      return <Utensils className={sharedClassName} />;
    case "candy_off":
      return <CandyOff className={sharedClassName} />;
    case "droplets":
      return <Droplets className={sharedClassName} />;
    case "footprints":
      return <Footprints className={sharedClassName} />;
    case "book_open":
      return <BookOpen className={sharedClassName} />;
    default:
      return <BookOpen className={sharedClassName} />;
  }
}
