"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { emailInitials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  email: string;
  name?: string;
  avatarUrl?: string | null;
  className?: string;
  fallbackClassName?: string;
};

export function UserAvatar({ email, name, avatarUrl, className, fallbackClassName }: Props) {
  const initials = emailInitials(email);

  return (
    <Avatar className={className}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? email} /> : null}
      <AvatarFallback className={cn("text-xs font-bold", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
