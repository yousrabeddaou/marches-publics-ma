"use client";

import type { CategoryRef } from "@/lib/types";

interface Props {
  category: CategoryRef;
  size?: "sm" | "md";
}

export function CategoryBadge({ category, size = "sm" }: Props) {
  const cls = size === "sm"
    ? "px-2 py-0.5 text-xs"
    : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${cls}`}
      style={{
        backgroundColor: `${category.color}1A`, // 10% opacity
        color: category.color,
        border: `1px solid ${category.color}33`, // 20% opacity
      }}
    >
      {category.icon && <span>{category.icon}</span>}
      {category.name}
    </span>
  );
}
