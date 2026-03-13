"use client";

interface Props {
  firstName: string;
  ticketNumber: string;
  eventTitle: string;
  guestName?: string;
  formattedDate: string;
  question: string;
}

export default function CinemaTicket({
  firstName,
  ticketNumber,
  eventTitle,
  formattedDate,
  question,
}: Props) {
  return (
    <div className="bg-black border border-white/30 p-8 relative">
      {/* Perforation line */}
      <div className="absolute right-0 top-0 bottom-0 w-8 border-l border-dashed border-white/20 flex items-center justify-center">
        <span className="text-white/20 text-xs -rotate-90 whitespace-nowrap tracking-widest">
          ADMIT ONE
        </span>
      </div>

      <div className="pr-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="font-serif text-2xl tracking-[0.15em] text-white font-bold">
              Behind The Diary
            </h3>
            <p className="text-doac-gray text-xs tracking-widest mt-1">
              PRIVATE SCREENING
            </p>
          </div>
          <div className="text-right">
            <p className="text-doac-gray text-xs">NO.</p>
            <p className="font-serif text-2xl text-white">#{ticketNumber}</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-6" />

        {/* Details */}
        <div className="space-y-4">
          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-1">NAME</p>
            <p className="font-serif text-xl text-white">{firstName}</p>
          </div>

          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-1">SCREENING</p>
            <p className="font-serif text-lg text-white">{eventTitle}</p>
          </div>

          <div>
            <p className="text-doac-gray text-xs tracking-widest mb-1">DATE &amp; TIME</p>
            <p className="text-white text-sm">{formattedDate}</p>
          </div>

          {question && (
            <div>
              <p className="text-doac-gray text-xs tracking-widest mb-1">
                YOUR QUESTION
              </p>
              <p className="text-white/80 text-sm italic">
                &ldquo;{question}&rdquo;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
