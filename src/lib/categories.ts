export const CATEGORIES = [
  // Gig / service
  'Cleaning',
  'Moving',
  'Delivery',
  'Repairs',
  'Tutoring',
  'Babysitting',
  'Gardening',
  'Photography',
  'Cooking',
  'Driving',
  'Event Help',
  // Professional / permanent
  'Software & Tech',
  'Design & Creative',
  'Marketing & Sales',
  'Finance & Accounting',
  'Healthcare',
  'Education',
  'Hospitality & Tourism',
  'Construction & Labor',
  'Administrative',
  'Customer Service',
  'Legal',
  'Human Resources',
  'Engineering',
  'Media & Communications',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'permanent',
  'freelance',
  'internship',
  'temporary',
] as const

export const SALARY_PERIODS = [
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'yearly',
] as const

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  permanent: 'Permanent',
  freelance: 'Freelance',
  internship: 'Internship',
  temporary: 'Temporary',
}

export const SALARY_PERIOD_LABELS: Record<string, string> = {
  hourly: '/hr',
  daily: '/day',
  weekly: '/week',
  monthly: '/mo',
  yearly: '/yr',
}