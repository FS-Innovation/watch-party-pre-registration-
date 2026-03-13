import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-doac-gray text-xs tracking-[0.3em] mb-4 animate-fade-in">
          BEHIND THE DIARY
        </p>
        <h1 className="font-serif text-4xl md:text-6xl mb-6 animate-fade-in">
          Private Screening
        </h1>
        <p className="text-doac-gray text-lg mb-10 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          Join us to watch an unaired episode of Behind The Diary.
        </p>
        <Link
          href="/register"
          className="inline-block bg-doac-red text-white px-10 py-4 text-lg font-medium tracking-wide hover:opacity-90 transition-opacity animate-fade-in"
          style={{ animationDelay: "1s" }}
        >
          Enter
        </Link>
      </div>
    </main>
  );
}
