export interface LumaEvent {
  id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at?: string;
  timezone?: string;
  url?: string;
}

export interface LumaGuest {
  id: string;
  user_name?: string;
  user_email?: string;
  approval_status: string;
  checked_in_at?: string | null;
  registration_answers?: Array<{
    label: string;
    value: string | string[] | boolean;
    answer: string | string[] | boolean;
    question_id: string;
    question_type: string;
  }>;
}

export interface LumaEventEntry {
  api_id: string;
  event: LumaEvent;
}

export interface LumaGuestEntry {
  api_id: string;
  guest: LumaGuest;
}
