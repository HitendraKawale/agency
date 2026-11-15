"use client";

// The site's button: the prototype's shape and colours (46px, 8px corners, white or quiet grey) with the
// text, border and motion of the expand-ring component: 13px medium tight text, a faint white/5 border,
// a spring scale on hover and press, and a white/20 ring that leaves the edge on hover, growing and
// fading out. Renders a link when given `href`, otherwise a <button>.
import { AnimatePresence, motion } from "motion/react";
import NextLink from "next/link";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

const MotionLink = motion.create(NextLink);

const VARIANTS = {
  primary: "bg-white text-noir hover:bg-ink-1",
  quiet: "bg-raised text-white hover:bg-raised-hover",
} as const;

type Props = {
  label: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentProps<typeof MotionLink>, "children" | "className">)
  | ({ href?: undefined } & Omit<ComponentProps<typeof motion.button>, "children" | "className">)
);

export function Button({ label, variant = "quiet", className, ...rest }: Props) {
  const [hovered, setHovered] = useState(false);

  const shared = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.96 },
    transition: { type: "spring", stiffness: 400, damping: 28 } as const,
    className: cn(
      "relative inline-flex h-[46px] cursor-pointer items-center rounded-[8px] border border-white/5 px-[18px] font-sans text-[13px] leading-none font-medium tracking-tight no-underline",
      "transition-colors duration-250 ease-expo",
      VARIANTS[variant],
      className,
    ),
  };

  const content = (
    <>
      {label}
      <AnimatePresence>
        {hovered && (
          <motion.span
            aria-hidden
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-none absolute inset-0 rounded-[8px] border border-white/20"
          />
        )}
      </AnimatePresence>
    </>
  );

  if (rest.href !== undefined) {
    return (
      <MotionLink {...(rest as ComponentProps<typeof MotionLink>)} {...shared}>
        {content}
      </MotionLink>
    );
  }
  return (
    <motion.button type="button" {...(rest as ComponentProps<typeof motion.button>)} {...shared}>
      {content}
    </motion.button>
  );
}
