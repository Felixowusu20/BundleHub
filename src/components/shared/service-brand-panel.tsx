import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ServiceBrandKey } from "@/lib/service-brand";
import {
  Bolt,
  Droplets,
  GraduationCap,
  Smartphone,
  Sparkles,
  Tv
} from "lucide-react";

type Props = {
  brandKey: ServiceBrandKey;
  imageSrc?: string;
  alt?: string;
  className?: string;
};

function CategoryMark({
  icon: Icon,
  label
}: {
  icon: typeof Bolt;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-white">
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
        <Icon className="h-9 w-9" strokeWidth={1.75} />
      </div>
      <span className="max-w-[100px] text-center text-xs font-semibold leading-tight">
        {label}
      </span>
    </div>
  );
}

function FallbackMark({ brandKey }: { brandKey: ServiceBrandKey }) {
  switch (brandKey) {
    case "electricity":
      return <CategoryMark icon={Bolt} label="Electricity" />;
    case "water":
      return <CategoryMark icon={Droplets} label="Water" />;
    case "tv":
      return <CategoryMark icon={Tv} label="TV" />;
    case "digital":
      return <CategoryMark icon={Sparkles} label="Digital" />;
    case "airtime":
      return <CategoryMark icon={Smartphone} label="Airtime" />;
    case "waec":
      return <CategoryMark icon={GraduationCap} label="WAEC" />;
    case "bece":
      return <CategoryMark icon={GraduationCap} label="BECE" />;
    default:
      return null;
  }
}

export function ServiceBrandPanel({ brandKey, imageSrc, alt, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex min-h-[180px] items-stretch justify-center overflow-hidden md:min-h-full",
        className
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt ?? brandKey}
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 180px"
          priority={false}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4">
          <FallbackMark brandKey={brandKey} />
        </div>
      )}
    </div>
  );
}
