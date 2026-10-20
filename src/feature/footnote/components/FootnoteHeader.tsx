"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function FootnoteHeader() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex h-[78px] w-full max-w-[1260px] items-center justify-between border-b border-[#d9ddcf] px-7 max-sm:h-[66px] max-sm:px-4">
      <Link href="/" className="flex items-center gap-3 font-serif text-[22px] font-bold text-[#10110e] no-underline">
        <span className="grid size-5 place-items-center rounded-[5px] bg-[#11130f] text-[15px] text-white">✤</span>
        StrandLab
      </Link>
      <nav className="flex h-full items-center gap-8 max-sm:gap-3" aria-label="Primary navigation">
        {["home", "review", "vocabulary", "stats"].map((item) => (
          <Link key={item} href={item === "home" ? "/" : `/#${item}`} className={`relative font-mono text-[13px] text-[#23251f] no-underline max-sm:text-[11px] ${item === "home" && (pathname === "/" || pathname.startsWith("/entries/")) ? "after:absolute after:-bottom-[13px] after:left-1/2 after:h-0.5 after:w-[18px] after:-translate-x-1/2 after:bg-[#25251f]" : ""}`}>
            {item}
          </Link>
        ))}
      </nav>
    </header>
  );
}
