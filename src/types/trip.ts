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
  required: boolean;
  options?: FormFieldOption[];
  conditionalFields?: ConditionalField[];
  countsAsParticipant?: boolean;
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
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';

export interface Registration {
  id: string;
  trip_id: string;
  form_data: Record<string, any>;
  payment_status: PaymentStatus;
  payment_note?: string;
  created_at: string;
  updated_at: string;
}
