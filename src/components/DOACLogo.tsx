"use client";

export default function DOACLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`font-serif tracking-[0.3em] ${className}`}>
      <span className="text-white font-bold">DOAC</span>
    </div>
  );
}
