// URL <-> view mapping (src/router.js), including the /monster/<slug> addresses.
import { describe, it, expect } from 'vitest';
import { monsterSlug, buildUrl, parseLocation, normalizeView, titleFor } from '../src/router.js';

const loc = (pathname, search = '') => ({ pathname, search });

describe('monsterSlug', () => {
  it('lowercases, strips accents and punctuation, joins with dashes', () => {
    expect(monsterSlug('Lushen')).toBe('lushen');
    expect(monsterSlug('Alice / Hollyberry Cookie')).toBe('alice-hollyberry-cookie');
    expect(monsterSlug('Wind Qilin Slasher')).toBe('wind-qilin-slasher');
    expect(monsterSlug('Altaïr')).toBe('altair');
    expect(monsterSlug('ROBO-R40')).toBe('robo-r40');
    expect(monsterSlug('  Mo Long  ')).toBe('mo-long');
    expect(monsterSlug('')).toBe('');
  });
});

describe('buildUrl', () => {
  it('maps views to paths and params to short query keys', () => {
    expect(buildUrl('dashboard')).toBe('/');
    expect(buildUrl('3mdc', { search: 'Seara Orion Perna' })).toBe('/3mdc?q=Seara+Orion+Perna');
    expect(buildUrl('my-box', { subItem: 'meta' })).toBe('/my-box?tab=meta');
    expect(buildUrl('war-room')).toBe('/guild-war-room'); // alias
    expect(buildUrl('nope')).toBe('/');
  });
  it('gives a catalog monster its own path', () => {
    expect(buildUrl('catalog', { initialMonster: 'Alice / Hollyberry Cookie' })).toBe('/monster/alice-hollyberry-cookie');
    expect(buildUrl('catalog', { initialMonster: 'Lushen', search: 'x' })).toBe('/monster/lushen?q=x');
    expect(buildUrl('where2use', { initialMonster: 'Lushen' })).toBe('/where2use?monster=Lushen'); // other views keep the query form
  });
});

describe('parseLocation', () => {
  it('reads the view and params back', () => {
    expect(parseLocation(loc('/'))).toEqual({ view: 'dashboard', params: {} });
    expect(parseLocation(loc('/3mdc/', '?q=Seara'))).toEqual({ view: '3mdc', params: { search: 'Seara' } });
    expect(parseLocation(loc('/unknown-page'))).toEqual({ view: 'dashboard', params: {} });
  });
  it('turns /monster/<slug> into the catalog with that monster', () => {
    expect(parseLocation(loc('/monster/lushen'))).toEqual({ view: 'catalog', params: { initialMonster: 'lushen' } });
    expect(parseLocation(loc('/monster/alice-hollyberry-cookie/', '?tab=x'))).toEqual({ view: 'catalog', params: { subItem: 'x', initialMonster: 'alice-hollyberry-cookie' } });
    expect(parseLocation(loc('/monster/')).view).toBe('dashboard'); // no slug → not a monster page
  });
  it('round-trips through buildUrl', () => {
    const url = buildUrl('catalog', { initialMonster: 'Wind Qilin Slasher' });
    expect(parseLocation(loc(url))).toEqual({ view: 'catalog', params: { initialMonster: 'wind-qilin-slasher' } });
  });
});

describe('titles', () => {
  it('normalizes aliases and titles views', () => {
    expect(normalizeView('optimizer')).toBe('artifact');
    expect(titleFor('catalog')).toBe('สารานุกรมมอนสเตอร์ | SWM');
    expect(titleFor('dashboard')).toMatch(/^SWM/);
  });
});
