export interface HelpSection {
  title: string;
  body: string[];
}

export interface HelpView {
  icon: string;
  title: string;
  sections: HelpSection[];
}

export const HELP_CONTENT: Record<string, HelpView> = {
  '/': {
    icon: '📊',
    title: 'Dashboard',
    sections: [
      {
        title: 'This page gives you a live snapshot of both your income streams.',
        body: [],
      },
      {
        title: 'KPI Cards',
        body: [
          'Each card auto-updates when you add trades or update prospects.',
          '• Win Rate: your winning trades ÷ total closed trades',
          '• Total P&L: sum of all closed trade profits/losses in Rands',
          '• Avg R/Trade: average risk-reward multiple per trade',
          '• Prospects Reached: how many of your 100 target businesses you have contacted',
          '• Deals Won: CRM prospects marked as "Won"',
          '• Pipeline Value: total estimated deal value for all active (non-Won/Lost) prospects',
        ],
      },
      {
        title: 'Charts',
        body: [
          '• The bar chart shows your last 14 trades — green bars are profits, red are losses.',
          '• The pipeline chart shows how many prospects are at each stage.',
        ],
      },
      {
        title: 'Activity Feed',
        body: ['The 10 most recent actions across both modules, newest first.'],
      },
    ],
  },
  '/trading': {
    icon: '📈',
    title: 'Trading Journal',
    sections: [
      {
        title: 'Track every trade you take on USD/JPY, GBP/JPY and XAU/USD.',
        body: [],
      },
      {
        title: 'Adding a Trade',
        body: [
          'Click "+ Add Trade" in the top right. Fill in your entry details — P&L (R) and P&L (R) calculate automatically as you type.',
        ],
      },
      {
        title: 'Fields explained',
        body: [
          '• Date / Day: pick the date; the day of week fills automatically.',
          '• Asset: choose from USD/JPY, GBP/JPY or XAU/USD.',
          '• Direction: BUY if you went long, SELL if you went short.',
          '• Session: which trading session you entered in.',
          '• Entry / Exit Price: your actual fill prices.',
          '• Position Size: lot size (e.g. 0.10 for a micro lot).',
          '• Stop Loss / Take Profit: your planned levels.',
          '• P&L (R): risk multiple — how many R\'s you made or lost. Formula: (Exit − Entry) ÷ (Entry − SL) for a BUY.',
          '• P&L (R): Rand value = R-multiple × lot size × pip value.',
          '• Outcome: mark Win, Loss, Break Even, or leave Open for running trades.',
          '• Setup: the strategy or pattern you traded (e.g. "ICT OTE + BOS").',
          '• Notes: what you observed; lessons learned.',
        ],
      },
      {
        title: 'Filtering',
        body: ['Use the filter bar to narrow by date range, asset, or outcome.'],
      },
      {
        title: 'Row colours',
        body: ['Green = Win · Red = Loss · Yellow = Open/Break Even'],
      },
    ],
  },
  '/crm': {
    icon: '🤝',
    title: 'IT Services CRM',
    sections: [
      {
        title:
          'Your 100-prospect cold outreach pipeline for IT services.',
        body: [],
      },
      {
        title: 'Adding a Prospect',
        body: [
          'Click "+ Add Prospect". Fill in contact details, your first contact date, the stage, and what service they are interested in.',
        ],
      },
      {
        title: 'Fields explained',
        body: [
          '• Business / Contact Name: the company or individual you approached.',
          '• Outreach Method: how you made first contact.',
          '• Stage: where they are in your sales pipeline. New Lead → Contacted → Interested → Meeting Booked → Proposal Sent → Negotiation → Won / Lost',
          '• Service Interest: which IT services they expressed interest in. You can select multiple.',
          '• Est. Deal Value: your estimated monthly or once-off contract value in Rands.',
          '• Priority: 🔴 High, 🟡 Medium, 🟢 Low — use this to decide your daily call order.',
          '• Next Action / Date: what you need to do next and by when. Overdue actions are highlighted in red.',
          '• Follow-ups: auto-counted — increments each time you change the stage.',
          '• Outcome: Open (still active), Won (client), Lost, Not Interested, or Call Back.',
        ],
      },
      {
        title: 'Pipeline Summary',
        body: ['The right-side panel shows totals per stage and estimated value.'],
      },
      {
        title: 'Progress Tracker',
        body: [
          'Top of the page shows X / 100 prospects reached.',
          'Goal: contact all 100, then work the pipeline to close.',
        ],
      },
    ],
  },
};
