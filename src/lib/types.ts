export interface Registration {
  id?: string;
  event_id: string;
  first_name: string;
  email: string;
  city: string;
  timezone: string;
  device_type: string;
  segment_choice: string;
  guest_question: string;
  ai_tags: Record<string, unknown> | null;
  ticket_number: string;
  referral_code: string;
  referred_by: string | null;
  commitment_confirmed: boolean;
  committed_at: string | null;
  ticket_shared: boolean;
  calendar_saved: boolean;
  created_at?: string;
}

export interface Referral {
  id?: string;
  referrer_registration_id: string;
  referred_email: string;
  referral_code: string;
  converted: boolean;
  created_at?: string;
}

export interface ScreeningEvent {
  id: string;
  title: string;
  guest_name: string;
  description: string;
  date: string;
  time: string;
  trailer_url: string;
  thumbnail_url: string;
  postcard_video_url: string;
}

export interface RegistrationState {
  currentScreen: number;
  segmentChoice: string;
  segmentLabel: string;
  guestQuestion: string;
  firstName: string;
  email: string;
  city: string;
  timezone: string;
  ticketNumber: string;
  referralCode: string;
  referredBy: string | null;
  registrationId: string | null;
  screenEnteredAt: number;
}

export const INITIAL_STATE: RegistrationState = {
  currentScreen: 1,
  segmentChoice: "",
  segmentLabel: "",
  guestQuestion: "",
  firstName: "",
  email: "",
  city: "",
  timezone: "",
  ticketNumber: "",
  referralCode: "",
  referredBy: null,
  registrationId: null,
  screenEnteredAt: Date.now(),
};

export const DEMO_EVENT: ScreeningEvent = {
  id: "screening-001",
  title: "The Art of Letting Go",
  guest_name: "Dr. Gabor Maté",
  description: "A conversation about trauma, healing, and the courage to feel.",
  date: "2026-03-28",
  time: "20:00",
  trailer_url: "/videos/trailer.mp4",
  thumbnail_url: "/images/episode-thumbnail.jpg",
  postcard_video_url: "/videos/steven-postcard.mp4",
};
