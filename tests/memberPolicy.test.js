import { describe, it, expect } from 'vitest';
import {
  isFreeView,
  isUserMember,
  isViewLocked,
  filterNavigationCategories,
  FREE_VIEW_IDS,
} from '../src/utils/memberPolicy';

describe('SWM Membership Policy', () => {
  it('correctly identifies 100% free views for public/SEO', () => {
    // 6 Main Free Views
    expect(isFreeView('monster-catalog')).toBe(true);
    expect(isFreeView('monsters')).toBe(true);
    expect(isFreeView('game-codes')).toBe(true);
    expect(isFreeView('promo-codes')).toBe(true);
    expect(isFreeView('balance-patch')).toBe(true);
    expect(isFreeView('my-box')).toBe(true);
    expect(isFreeView('3mdc-search')).toBe(true);
    expect(isFreeView('3mdc')).toBe(true);
    expect(isFreeView('dashboard')).toBe(true);
    expect(isFreeView('faq-guides')).toBe(true);
    expect(isFreeView('quiz')).toBe(true);
  });

  it('correctly identifies locked VIP views for non-members', () => {
    expect(isFreeView('live-farm-monitor')).toBe(false);
    expect(isFreeView('ai-farm-optimizer')).toBe(false);
    expect(isFreeView('guild-war-room')).toBe(false);
    expect(isFreeView('siege-planner')).toBe(false);
    expect(isFreeView('rta')).toBe(false);
    expect(isFreeView('draft-explorer')).toBe(false);
    expect(isFreeView('player-tracker')).toBe(false);
    expect(isFreeView('speed-calculator')).toBe(false);
  });

  it('checks isUserMember for guests, admins and VIP metadata', () => {
    // Guest
    expect(isUserMember(null, false)).toBe(false);

    // Admin
    expect(isUserMember(null, true)).toBe(true);
    expect(isUserMember({ email: 'admin@swm.com' }, true)).toBe(true);

    // User with VIP metadata
    expect(isUserMember({ user_metadata: { tier: 'vip' } }, false)).toBe(true);
    expect(isUserMember({ user_metadata: { is_vip: true } }, false)).toBe(true);
    expect(isUserMember({ user_metadata: { role: 'pro' } }, false)).toBe(true);

    // Free registered user without VIP metadata
    expect(isUserMember({ user_metadata: { tier: 'free' } }, false)).toBe(false);
  });

  it('checks isViewLocked correctly', () => {
    // Non-member trying to access locked view
    expect(isViewLocked('live-farm-monitor', false)).toBe(true);
    expect(isViewLocked('siege-planner', false)).toBe(true);

    // Non-member accessing free view
    expect(isViewLocked('monster-catalog', false)).toBe(false);
    expect(isViewLocked('game-codes', false)).toBe(false);

    // Member accessing any view
    expect(isViewLocked('live-farm-monitor', true)).toBe(false);
    expect(isViewLocked('siege-planner', true)).toBe(false);
  });

  it('filters navigation categories for non-members, hiding paid views', () => {
    const mockCategories = [
      {
        id: 'suite',
        title: 'Suite',
        items: [
          { id: 'my-box', label: 'My Box' },
          { id: 'live-farm-monitor', label: 'Live Monitor' },
        ],
      },
      {
        id: 'rta',
        title: 'RTA',
        items: [
          { id: 'rta-meta', label: 'RTA Meta' },
        ],
      },
      {
        id: 'tools',
        title: 'Tools',
        items: [
          { id: 'monster-catalog', label: 'Catalog' },
          { id: 'speed-calculator', label: 'Speed' },
        ],
      },
    ];

    // Non-member: hides paid items and categories with 0 items left
    const filtered = filterNavigationCategories(mockCategories, false);
    expect(filtered.length).toBe(2);
    expect(filtered[0].items.map((i) => i.id)).toEqual(['my-box']);
    expect(filtered[1].items.map((i) => i.id)).toEqual(['monster-catalog']);

    // Member: keeps all items
    const allItems = filterNavigationCategories(mockCategories, true);
    expect(allItems.length).toBe(3);
  });
});
