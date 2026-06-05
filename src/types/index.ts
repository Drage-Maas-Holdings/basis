export type Asset = 'USDJPY' | 'GBPJPY' | 'XAUUSD';
export type Direction = 'BUY' | 'SELL';
export type Session =
  | 'London'
  | 'New York'
  | 'Asian'
  | 'London-NY Overlap';
export type Outcome = 'Win' | 'Loss' | 'Break Even' | 'Open';

export interface Trade {
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

export type TradeInput = Omit<
  Trade,
  'id' | 'trade_day' | 'pnl_r' | 'pnl_currency' | 'created_at' | 'updated_at'
>;

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

export type ProspectOutcome =
  | 'Open'
  | 'Won'
  | 'Lost'
  | 'Not Interested'
  | 'Call Back';

export type Priority = 'High' | 'Medium' | 'Low';

export type OutreachMethod =
  | 'Cold Call'
  | 'In-Person Visit'
  | 'WhatsApp'
  | 'Email'
  | 'Referral';

export type BusinessType =
  | 'Retail'
  | 'Restaurant'
  | 'Medical'
  | 'Legal'
  | 'Real Estate'
  | 'Manufacturing'
  | 'Education'
  | 'NGO'
  | 'Government'
  | 'Other';

export type ServiceInterest =
  | 'IT Support'
  | 'Networking'
  | 'CCTV'
  | 'Website Dev'
  | 'Software'
  | 'Cloud Services'
  | 'Hardware'
  | 'Training'
  | 'Other';

export interface Prospect {
  id: number;
  business_name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  location: string | null;
  business_type: BusinessType | null;
  outreach_method: OutreachMethod | null;
  first_contact_date: string | null;
  stage: ProspectStage;
  last_activity_date: string | null;
  next_action: string | null;
  next_action_date: string | null;
  service_interest: ServiceInterest[];
  est_deal_value: number;
  priority: Priority;
  outcome: ProspectOutcome;
  follow_up_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProspectInput = Omit<
  Prospect,
  'id' | 'follow_up_count' | 'created_at' | 'updated_at'
>;

export interface TradeStats {
  total: number;
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number;
  totalPnlR: number;
  totalPnlCurrency: number;
  avgR: number;
}

export interface PipelineSummary {
  stageCounts: Record<ProspectStage, number>;
  stageValues: Record<ProspectStage, number>;
  totalActive: number;
  totalActiveValue: number;
}

export interface DashboardStats {
  trading: {
    totalTrades: number;
    wins: number;
    losses: number;
    breakEven: number;
    winRate: number;
    totalPnlR: number;
    totalPnlCurrency: number;
    avgR: number;
    recentTrades: Trade[];
  };
  crm: {
    totalReached: number;
    dealsWon: number;
    pipelineValue: number;
    stageCounts: Record<ProspectStage, number>;
    stageValues: Record<ProspectStage, number>;
  };
}

export interface ActivityItem {
  id: number;
  source: 'trade' | 'crm';
  source_id: number;
  description: string;
  created_at: string;
}
