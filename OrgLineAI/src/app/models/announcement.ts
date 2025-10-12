export interface Announcement {
  id: string;
  title: string;
  body: string;
  ctaText?: string;
  ctaHref?: string;
  type?: 'announcement' | 'notice';
}
