import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import MyBoxView from '../src/views/MyBoxView.jsx';
import { loadDemoBox } from '../src/utils/swexImport.js';
import { loadPublicSettings } from '../src/services/adminClient.js';

describe('MyBoxView rendering & lifecycle', () => {
  it('has loadPublicSettings defined and imported correctly', () => {
    expect(typeof loadPublicSettings).toBe('function');
  });

  it('renders without error when no box is loaded (fresh visitor)', () => {
    const html = renderToString(React.createElement(MyBoxView, {}));
    expect(html).toBeDefined();
    expect(html).toContain('กล่องมอนสเตอร์');
  });

  it('renders without error when demo box is loaded', () => {
    const demo = loadDemoBox();
    globalThis.localStorage = {
      getItem: (key) => key === 'swm:mybox' ? JSON.stringify(demo) : null,
      setItem: () => {},
      removeItem: () => {},
    };
    const html = renderToString(React.createElement(MyBoxView, {}));
    expect(html).toBeDefined();
    expect(html).toContain('Account Assessment');
  });

  it('renders across different tabs (pokedex, artifacts, efficiency, etc.) without throwing', () => {
    const demo = loadDemoBox();
    globalThis.localStorage = {
      getItem: (key) => key === 'swm:mybox' ? JSON.stringify(demo) : null,
      setItem: () => {},
      removeItem: () => {},
    };
    for (const tab of ['pokedex', 'artifacts', 'efficiency', 'defense', 'teams', 'meta', 'speed', 'runes']) {
      const html = renderToString(React.createElement(MyBoxView, { tab }));
      expect(html).toBeDefined();
    }
  });
});
