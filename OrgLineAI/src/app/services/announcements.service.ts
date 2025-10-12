import { Injectable } from '@angular/core';
import { Announcement } from '../models/announcement';

@Injectable({ providedIn: 'root' })
export class AnnouncementsService {
  private readonly KEY = 'announcements';

  list(): Announcement[] {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) {
      console.log('No announcements in storage');
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn('Bad announcements JSON, resetting');
      return [];
    }
  }

  seedIfEmpty(): void {
    const current = this.list();
    if (current.length > 0) return;

    const mock: Announcement[] = [
      {
        id: '1',
        title: 'New Company Policy on Remote Work',
        body: 'Please review the updated policy effective next month.',
        ctaText: 'Read more',
        type: 'announcement',
      },
      {
        id: '2',
        title: 'Annual Employee Survey is Live',
        body: 'Your feedback is important! Participate today.',
        ctaText: 'Take the survey',
        type: 'notice',
      },
      {
        id: '3',
        title: 'Health & Wellness Seminar',
        body: 'Join us this Friday for a seminar on wellbeing.',
        ctaText: 'Sign up',
        type: 'notice',
      },
    ];

    console.log('Seeding mock announcements');
    localStorage.setItem(this.KEY, JSON.stringify(mock));
  }
}
