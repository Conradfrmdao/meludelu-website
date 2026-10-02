import Link from "next/link";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Meludelu, home" className={`font-serif leading-none tracking-[0.22em] ${className}`}>
      MELUDELU
    </Link>
  );
}
