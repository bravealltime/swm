import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import MdcView from '../src/views/MdcView.jsx';
import DraftExplorerView from '../src/views/DraftExplorerView.jsx';
import ArenaMetaView from '../src/views/ArenaMetaView.jsx';
import DashboardView from '../src/views/DashboardView.jsx';
import MyBoxView from '../src/views/MyBoxView.jsx';

describe('Views with AI panels render test', () => {
  it('renders MdcView without error', () => {
    const html = renderToString(React.createElement(MdcView, {}));
    expect(html).toBeDefined();
    expect(html).toContain('3MDC');
  });

  it('renders DraftExplorerView without error', () => {
    const html = renderToString(React.createElement(DraftExplorerView, {}));
    expect(html).toBeDefined();
  });

  it('renders ArenaMetaView without error', () => {
    const html = renderToString(React.createElement(ArenaMetaView, {}));
    expect(html).toBeDefined();
  });

  it('renders DashboardView without error', () => {
    const html = renderToString(React.createElement(DashboardView, {}));
    expect(html).toBeDefined();
  });

  it('renders MyBoxView without error', () => {
    const html = renderToString(React.createElement(MyBoxView, {}));
    expect(html).toBeDefined();
  });
});
