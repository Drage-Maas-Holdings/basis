export type Asset = 'USDJPY' | 'GBPJPY' | 'XAUUSD';
export type Direction = 'BUY' | 'SELL';
export type Session = 'London' | 'New York' | 'Asian' | 'London-NY Overlap';
export type Outcome = 'Win' | 'Loss' | 'Break Even' | 'Open';

export type ProspectStage =
  | 'New Lead'
  | 'Contacted'
  | 'Interested'
  | 'Meeting Booked'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'No Answer';

export type ProspectOutcome = 'Open' | 'Won' | 'Lost' | 'Not Interested' | 'Call Back';
export type Priority = 'High' | 'Medium' | 'Low';

export interface TradeRow {
  id: number;
  trade_date: string;
  trade_day: string;
  asset: Asset;
  direction: Direction;
  session: Session;
  entry_price: number;
  exit_price: number | null;
  position_size: number;
  stop_loss: number;
  take_profit: number | null;
  pnl_r: number | null;
  pnl_currency: number | null;
  outcome: Outcome;
  setup: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProspectRow {
  id: number;
  business_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  business_type: string | null;
  outreach_method: string | null;
  first_contact_date: string | null;
  stage: ProspectStage;
  last_activity_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  service_interest: string | null;
  est_deal_value: number;
  priority: Priority;
  outcome: ProspectOutcome;
  follow_up_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
