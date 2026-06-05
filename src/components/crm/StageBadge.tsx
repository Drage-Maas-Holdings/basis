import type { ProspectStage } from '../../types';
import { Badge, type BadgeVariant } from '../ui/Badge';

const stageVariant: Record<ProspectStage, BadgeVariant> = {
  'New Lead': 'info',
  Contacted: 'indigo',
  Interested: 'amber',
  'Meeting Booked': 'orange',
  'Proposal Sent': 'purple',
  Negotiation: 'pink',
  Won: 'win',
  Lost: 'loss',
  'No Answer': 'grey',
};

export function StageBadge({ stage }: { stage: ProspectStage }) {
  return <Badge variant={stageVariant[stage]}>{stage}</Badge>;
}
