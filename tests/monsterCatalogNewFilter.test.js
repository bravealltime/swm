import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import MonsterCatalogView from '../src/views/MonsterCatalogView';
import { MONSTERS } from '../src/data/monsters';

describe('MonsterCatalogView New Monsters and Search', () => {
  it('contains Cosmic Worm monsters in catalog data', () => {
    const cosmicWorms = MONSTERS.filter((m) => m.family === 'Cosmic Worm' || m.source === 'patch_9.3.6');
    expect(cosmicWorms.length).toBe(5);
    const names = cosmicWorms.map((m) => m.name);
    expect(names).toContain('Volcaris');
    expect(names).toContain('Maris');
    expect(names).toContain('Auraris');
    expect(names).toContain('Luminaris');
    expect(names).toContain('Noctaris');
  });

  it('renders MonsterCatalogView with new monster search and spotlight chip', () => {
    const mockNavigate = vi.fn();
    const html = renderToString(React.createElement(MonsterCatalogView, { onNavigate: mockNavigate }));

    // Check header and new monster spotlight chip
    expect(html).toContain('สารานุกรมมอนสเตอร์ &amp; ระบบตรวจสอบสกิล');
    expect(html).toContain('มอนสเตอร์ใหม่ล่าสุด (Cosmic Worm)');
    expect(html).toContain('5 ตัว');
  });

  it('renders with initialSearch for Cosmic Worm', () => {
    const mockNavigate = vi.fn();
    const html = renderToString(
      React.createElement(MonsterCatalogView, { initialSearch: 'Cosmic Worm', onNavigate: mockNavigate })
    );

    expect(html).toContain('Volcaris');
    expect(html).toContain('Maris');
    expect(html).toContain('Auraris');
    expect(html).toContain('Luminaris');
    expect(html).toContain('Noctaris');
    expect(html).toContain('NEW');
  });

  it('renders with initialSearch for Thai name หนอนอวกาศ', () => {
    const mockNavigate = vi.fn();
    const html = renderToString(
      React.createElement(MonsterCatalogView, { initialSearch: 'หนอนอวกาศ', onNavigate: mockNavigate })
    );

    expect(html).toContain('โวลคาริส');
    expect(html).toContain('มาริส');
    expect(html).toContain('NEW');
  });
});
