import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  // Generic get
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  // Generic set
  set<T>(key: string, val: T): void {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // Generic update (mutate existing value)
  update<T>(key: string, updater: (curr: T | null) => T): void {
    const current = this.get<T>(key);
    const next = updater(current);
    this.set(key, next);
  }
}
