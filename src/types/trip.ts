export type TripStatus = 'draft' | 'published' | 'closed';
export type TripCategory = 'ski' | 'group' | 'corporate' | 'other';

export type FormFieldType = 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox';

export interface FormFieldOption {
  label: string;
  value: string;
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

export interface Trip {
  id: string;
  title: string;
  description: string;
  destination: string;
  category: TripCategory;
  start_date: string;
  end_date: string;
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
  created_at: string;
  updated_at: string;
}
