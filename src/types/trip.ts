export type TripStatus = 'draft' | 'published' | 'closed';
export type TripCategory = 'ski' | 'group' | 'corporate' | 'other';

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

export interface FormFieldOption {
  label: string;
  value: string;
  priceModifier?: number;
  priceModifierCurrency?: string;
  /** Pris inte satt än — visa "(pris meddelas senare)" och hoppa över i totalen. */
  priceTbd?: boolean;
}

export interface ConditionalField {
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormFieldOption[];
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  description?: string;
  descriptionUrl?: string;
  required: boolean;
  priceModifier?: number;
  priceModifierCurrency?: string;
  /** Pris inte satt än (för kryssrutor) — visa "(pris meddelas senare)" och hoppa över i totalen. */
  priceTbd?: boolean;
  options?: FormFieldOption[];
  conditionalFields?: ConditionalField[];
  showInSummary?: boolean;
}

export interface PresentationQuestion {
  id: string;
  question: string;
  type: 'text' | 'textarea';
  placeholder?: string;
}

export interface TripDateRange {
  start_date: string;
  end_date: string;
  label?: string;
}

/**
 * Kampanjkod kopplad till en resa. Admin styr rabatten själv.
 * - type 'percent': value = procent (0–100). 100 = gratis.
 * - type 'fixed': value = fast belopp i SEK som dras av.
 * Rabatten räknas på hela totalen (grundpris + prismodifierare).
 */
export interface PromoCode {
  /** Koden kunden anger. Matchas skiftlägesokänsligt. */
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  /** Intern notering, t.ex. "Lojal kund" eller "Jobbar på resan". Visas inte för kunden. */
  label?: string;
}

/**
 * Nedladdningsbar info-fil (PDF) som visas för kunder på bokningssidan,
 * t.ex. reseprogram eller packlista. Lagras i Supabase Storage.
 */
export interface TripInfoFile {
  /** Visningsnamn på bokningssidan, t.ex. "Resenärsschema". */
  name: string;
  /** Publik nedladdnings-URL. */
  url: string;
  /** Sökväg i storage-bucketen — används för borttagning. */
  path: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  category: TripCategory;
  start_date: string;
  end_date: string;
  additional_dates?: TripDateRange[];
  price: number;
  currency: string;
  max_participants: number;
  show_spots_left: boolean;
  spots_left_threshold?: number;
  image_url: string;
  image_position?: string;
  status: TripStatus;
  form_fields: FormField[];
  presentation_fields: PresentationQuestion[];
  promo_codes?: PromoCode[];
  info_files?: TripInfoFile[];
  payment_info?: {
    swish?: { number: string; name: string; amount?: number };
    viva?: { url: string; amount?: number };
    deposit?: number;
    note?: string;
  };
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';

export interface Registration {
  id: string;
  trip_id: string;
  form_data: Record<string, any>;
  presentation_data?: Record<string, string>;
  payment_status: PaymentStatus;
  payment_note?: string;
  /** AI-genererad presentation av deltagaren, byggd från lära känna-svaren. */
  ai_summary?: string;
  created_at: string;
  updated_at: string;
}
