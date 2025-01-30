export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRAITE = 'inappropriate',
  MISINFORMATION = 'misinformation',
  FAKE = 'fake',
  PERSONAL = 'personal',
}

export type ReportDescription = { [K in ReportReason]: Record<string, string> };

export const REPORT_DESCRIPTION: ReportDescription = {
  [ReportReason.SPAM]: {
    title: 'Spam',
    content: 'Promotional or repetitive.',
  },
  [ReportReason.INAPPROPRAITE]: {
    title: 'Inappropriate',
    content: 'Contains offensive language, harassment or hate speech',
  },
  [ReportReason.MISINFORMATION]: {
    title: 'Misinformation',
    content: 'Spreads false information.',
  },
  [ReportReason.FAKE]: {
    title: 'Fake',
    content: 'Appears to be fake or biased.',
  },
  [ReportReason.PERSONAL]: {
    title: 'Personal Information',
    content: 'Contains private information.',
  },
};
