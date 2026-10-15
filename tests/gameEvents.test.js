import { describe, it, expect } from 'vitest';
import gameEventsData from '../src/data/gameEvents.json';
import { normalizeView, titleFor, buildUrl } from '../src/router.js';
import { isFreeView } from '../src/utils/memberPolicy.js';

describe('Game Events & Quiz Solver Database', () => {
  it('has valid structure with active events and quiz questions', () => {
    expect(gameEventsData).toBeDefined();
    expect(Array.isArray(gameEventsData.events)).toBe(true);
    expect(gameEventsData.events.length).toBeGreaterThanOrEqual(3);
    expect(Array.isArray(gameEventsData.quizQuestions)).toBe(true);
    expect(gameEventsData.quizQuestions.length).toBeGreaterThanOrEqual(5);
  });

  it('each event contains mandatory fields: id, title, dates, missions, and rewards', () => {
    for (const ev of gameEventsData.events) {
      expect(ev.id).toBeDefined();
      expect(typeof ev.title).toBe('string');
      expect(ev.title.length).toBeGreaterThan(0);
      expect(ev.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(ev.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(ev.missions)).toBe(true);
      expect(Array.isArray(ev.rewards)).toBe(true);
      expect(ev.rewards.length).toBeGreaterThan(0);

      // Check rewards
      for (const rew of ev.rewards) {
        expect(rew.id).toBeDefined();
        expect(typeof rew.name).toBe('string');
        expect(typeof rew.amount).toBe('number');
        expect(rew.amount).toBeGreaterThan(0);
        expect(rew.tier).toBeDefined();
      }
    }
  });

  it('each quiz question has a valid question, options, explanation, and correct answer matching an option', () => {
    for (const q of gameEventsData.quizQuestions) {
      expect(q.id).toBeDefined();
      expect(typeof q.question).toBe('string');
      expect(q.question.length).toBeGreaterThan(5);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      expect(typeof q.correctAnswer).toBe('string');
      expect(q.options).toContain(q.correctAnswer);
      expect(typeof q.explanation).toBe('string');
      expect(q.explanation.length).toBeGreaterThan(5);
      expect(Array.isArray(q.keywords)).toBe(true);
      expect(q.keywords.length).toBeGreaterThan(0);
    }
  });

  it('allows fast search and retrieval of quiz answers by keywords', () => {
    const search = (term) => {
      const q = term.toLowerCase();
      return gameEventsData.quizQuestions.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.correctAnswer.toLowerCase().includes(q) ||
          (item.keywords || []).some((k) => k.toLowerCase().includes(q))
      );
    };

    expect(search('oliver').length).toBeGreaterThanOrEqual(1);
    expect(search('leo').length).toBeGreaterThanOrEqual(1);
    expect(search('violent').length).toBeGreaterThanOrEqual(1);
    expect(search('tiana').length).toBeGreaterThanOrEqual(1);
    expect(search('intangible').length).toBeGreaterThanOrEqual(1);
  });
});

describe('Game Events Routing & Navigation Integration', () => {
  it('normalizes events and game-events views', () => {
    expect(normalizeView('events')).toBe('events');
    expect(normalizeView('game-events')).toBe('events');
  });

  it('builds canonical URL for events view', () => {
    expect(buildUrl('events')).toBe('/events');
    expect(buildUrl('game-events')).toBe('/events');
    expect(buildUrl('events', { search: 'oliver', subItem: 'quiz' })).toBe('/events?q=oliver&tab=quiz');
  });

  it('has descriptive Thai title', () => {
    const title = titleFor('events');
    expect(title).toContain('กิจกรรม');
    expect(title).toContain('เฉลย');
  });

  it('is configured as a free view for all visitors', () => {
    expect(isFreeView('events')).toBe(true);
    expect(isFreeView('game-events')).toBe(true);
  });
});
