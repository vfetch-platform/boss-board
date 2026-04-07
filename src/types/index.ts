export interface Venue {
  id: string;
  name: string;
  type: string;
  address: string;
  city: string;
  postal_code?: string;
  phone: string;
  email: string;
  website?: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'available' | 'claimed' | 'collected' | 'expired';
  color?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  location_found?: string;
  date_found?: string;
  venue_id?: string;
  created_at: string;
}

export interface Claim {
  id: string;
  item_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'collected' | 'expired';
  payment_status: string;
  pickup_code?: string;
  notes?: string;
  created_at: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: 'user' | 'venue_staff' | 'admin';
  is_active: boolean;
  provider?: string;
  created_at: string;
}

export interface VenueUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  role: 'venue_staff' | 'venue_admin';
  venue_id: string;
  is_active: boolean;
  created_at: string;
}

export interface Query {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  item_description: string;
  booking_reference?: string;
  dates_of_stay?: { checkin?: string; checkout?: string };
  created_at: string;
}

export interface Transaction {
  id: string;
  claim_id?: string;
  amount?: number;
  currency?: string;
  status: string;
  stripe_payment_intent_id?: string;
  venue_share?: number;
  platform_share?: number;
  created_at: string;
  updated_at?: string;
}

export interface OverviewStats {
  venues: { total: number; pending: number; approved: number; rejected: number; suspended: number };
  items: { total: number; available: number };
  claims: { pending: number; approved: number; collected: number; expired: number };
  users: { total: number; active: number };
  venueUsers: { total: number; active: number };
  queries?: { total: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number };
}
