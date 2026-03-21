"use client";

interface Props {
  firstName: string;
  ticketNumber: string;
  eventTitle: string;
  guestName?: string;
  formattedDate: string;
  question?: string;
}

export default function CinemaTicket({
  firstName,
  ticketNumber,
  eventTitle,
  formattedDate,
}: Props) {
  return (
    <div className="bg-[#1c1b1b] border border-white/[0.08] relative flex flex-col overflow-hidden shadow-[0_48px_100px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="px-8 pt-8 pb-5 flex justify-between items-start border-b border-white/[0.06]">
        <div>
          <span className="text-[0.65rem] tracking-[0.3em] font-bold text-white/50 uppercase">
            BTD PRIVATE SCREENING
          </span>
        </div>
        <div className="text-white/20 text-2xl">
          &#9633;&#9633;
        </div>
      </div>

      {/* Name — large, editorial */}
      <div className="px-8 py-8 flex-grow">
        <h1 className="font-headline font-black text-4xl md:text-5xl uppercase tracking-tighter leading-none text-white mb-3">
          {firstName}
        </h1>
        <div className="font-mono text-xs tracking-widest text-doac-sand/70 mt-2">
          TICKET #{ticketNumber}
        </div>
      </div>

      {/* Details */}
      <div className="px-8 py-6 bg-white/[0.02] border-t border-white/[0.06]">
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <span className="text-[0.6rem] uppercase tracking-widest text-white/30 font-bold">SCREENING</span>
            <p className="text-sm font-medium text-white mt-1">{eventTitle}</p>
          </div>
          <div>
            <span className="text-[0.6rem] uppercase tracking-widest text-white/30 font-bold">DATE & TIME</span>
            <p className="text-sm font-medium text-white mt-1">{formattedDate}</p>
          </div>
          <div className="col-span-2 mt-1">
            <span className="text-[0.6rem] uppercase tracking-widest text-white/30 font-bold">LOCATION</span>
            <p className="text-sm font-medium text-white mt-1">Virtual &middot; Via Zoom</p>
          </div>
        </div>
      </div>

      {/* Bottom decorative strip */}
      <div className="h-10 px-8 flex items-center justify-between border-t border-white/[0.03]">
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 bg-white/10" />
          <div className="w-1.5 h-1.5 bg-doac-teal/30" />
          <div className="w-1.5 h-1.5 bg-white/10" />
          <div className="w-1.5 h-1.5 bg-white/10" />
          <div className="w-1.5 h-1.5 bg-doac-sand/30" />
        </div>
        <span className="font-mono text-[0.5rem] text-white/15 tracking-[0.3em] uppercase">
          Verified
        </span>
      </div>
    </div>
  );
}
