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
    <div className="bg-black border border-white/30 aspect-video relative flex flex-col justify-between p-6 md:p-8">
      {/* Perforation line */}
      <div className="absolute right-0 top-0 bottom-0 w-8 border-l border-dashed border-white/20 flex items-center justify-center">
        <span className="text-white/20 text-xs -rotate-90 whitespace-nowrap tracking-widest">
          ADMIT ONE
        </span>
      </div>

      <div className="pr-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-serif text-xl md:text-2xl tracking-[0.15em] text-white font-bold">
              Behind The Diary
            </h3>
            <p className="text-doac-gray text-xs tracking-widest mt-1">
              PRIVATE SCREENING
            </p>
          </div>
          <div className="text-right">
            <p className="text-doac-gray text-xs">NO.</p>
            <p className="font-serif text-xl md:text-2xl text-white">#{ticketNumber}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-4" />

        {/* Details — compact two-column grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-0.5">NAME</p>
            <p className="font-serif text-lg text-white">{firstName}</p>
          </div>

          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-0.5">SCREENING</p>
            <p className="font-serif text-lg text-white">{eventTitle}</p>
          </div>

          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-0.5">DATE &amp; TIME</p>
            <p className="text-white text-sm">{formattedDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
