export const ASSETS = ['USDJPY', 'GBPJPY', 'XAUUSD'] as const;
export const DIRECTIONS = ['BUY', 'SELL'] as const;
export const SESSIONS = [
  'London',
  'New York',
  'Asian',
  'London-NY Overlap',
] as const;
export const TRADE_OUTCOMES = ['Win', 'Loss', 'Break Even', 'Open'] as const;

export const PROSPECT_STAGES = [
  'New Lead',
  'Contacted',
  'Interested',
  'Meeting Booked',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'No Answer',
] as const;

export const OUTREACH_METHODS = [
  'Cold Call',
  'In-Person Visit',
  'WhatsApp',
  'Email',
  'Referral',
] as const;

export const BUSINESS_TYPES = [
  'Retail',
  'Restaurant',
  'Medical',
  'Legal',
  'Real Estate',
  'Manufacturing',
  'Education',
  'NGO',
  'Government',
  'Other',
] as const;

export const SERVICE_INTERESTS = [
  'IT Support',
  'Networking',
  'CCTV',
  'Website Dev',
  'Software',
  'Cloud Services',
  'Hardware',
  'Training',
  'Other',
] as const;

export const PRIORITIES = ['High', 'Medium', 'Low'] as const;
export const PROSPECT_OUTCOMES = [
  'Open',
  'Won',
  'Lost',
  'Not Interested',
  'Call Back',
] as const;
