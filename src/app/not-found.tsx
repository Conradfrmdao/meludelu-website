import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="font-serif text-[48px] leading-none">Page not found</h1>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Back to Meludelu
        </Link>
      </div>
    </main>
  );
}
