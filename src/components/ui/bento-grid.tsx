"use client";

interface BentoGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

const gapClasses = {
  sm: "gap-2 sm:gap-3",
  md: "gap-3 sm:gap-4",
  lg: "gap-4 sm:gap-5 md:gap-6",
};

const columnClasses = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function BentoGrid({
  children,
  columns = 3,
  gap = "md",
  className = "",
}: BentoGridProps) {
  return (
    <div
      className={`
        grid
        ${columnClasses[columns]}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
}

const colSpanClasses = {
  1: "",
  2: "sm:col-span-2",
};

const rowSpanClasses = {
  1: "",
  2: "sm:row-span-2",
};

export function BentoGridItem({
  children,
  className = "",
  colSpan = 1,
  rowSpan = 1,
}: BentoGridItemProps) {
  return (
    <div
      className={`
        ${colSpanClasses[colSpan]}
        ${rowSpanClasses[rowSpan]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
