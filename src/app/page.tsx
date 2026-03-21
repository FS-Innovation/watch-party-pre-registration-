import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center ambient-glow relative overflow-hidden">
      <div className="text-center relative z-10 px-6">
        <p className="font-script text-doac-sand text-lg -rotate-2 mb-4 animate-fade-in opacity-0">
          You&apos;ve been invited
        </p>
        <h1 className="font-headline font-black text-5xl md:text-8xl tracking-tighter leading-none uppercase mb-6 animate-fade-in opacity-0" style={{ animationDelay: "0.3s" }}>
          BTD PRIVATE
          <br />
          SCREENING
        </h1>
        <p className="text-white/40 text-sm md:text-base tracking-wide max-w-md mx-auto mb-12 animate-fade-in opacity-0" style={{ animationDelay: "0.6s" }}>
          An exclusive virtual screening experience by Steven Bartlett.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-3 border border-white/20 text-white px-12 py-5 font-headline font-bold text-sm tracking-[0.25em] uppercase hover:border-doac-teal hover:text-doac-teal transition-all duration-500 active:scale-[0.98] animate-fade-in opacity-0"
          style={{
            animationDelay: "0.9s",
            background: "linear-gradient(to right, rgba(26,107,122,0.08), transparent)",
          }}
        >
          CLAIM YOUR SEAT
          <span className="text-lg">&rarr;</span>
        </Link>
        <p className="text-white/20 text-[10px] tracking-widest uppercase mt-4 animate-fade-in opacity-0" style={{ animationDelay: "1.2s" }}>
          Takes 2 minutes. No payment required.
        </p>
      </div>
    </main>
  );
}
