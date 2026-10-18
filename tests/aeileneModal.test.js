import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import MonsterCatalogView from '../src/views/MonsterCatalogView';

describe('MonsterCatalogView with Aeilene', () => {
  it('renders modal with Aeilene without crashing', () => {
    const html = renderToString(React.createElement(MonsterCatalogView, { initialMonster: 'aeilene' }));
    expect(html).toContain('Aeilene');
    expect(html).toContain('Fairy');
  });
});
