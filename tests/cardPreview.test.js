import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import CardPreviewModal from '../src/components/CardPreviewModal.jsx';
import {
  showCardPreview,
  downloadCard,
  exportProfileCard,
  exportLdShowcaseCard,
  exportMonsterCard,
  exportArenaTeamCard,
} from '../src/utils/cardExporter.js';

describe('Card Preview System & Exporters', () => {
  it('exports card functions and preview utilities', () => {
    expect(typeof showCardPreview).toBe('function');
    expect(typeof downloadCard).toBe('function');
    expect(typeof exportProfileCard).toBe('function');
    expect(typeof exportLdShowcaseCard).toBe('function');
    expect(typeof exportMonsterCard).toBe('function');
    expect(typeof exportArenaTeamCard).toBe('function');
  });

  it('dispatches swm:card-preview event with correct payload when showCardPreview is called', () => {
    const listeners = {};
    globalThis.window = {
      addEventListener: (type, fn) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type, fn) => {
        if (listeners[type]) listeners[type] = listeners[type].filter((f) => f !== fn);
      },
      dispatchEvent: (evt) => {
        if (listeners[evt.type]) listeners[evt.type].forEach((fn) => fn(evt));
      },
    };
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail || {};
      }
    };

    const handler = vi.fn();
    globalThis.window.addEventListener('swm:card-preview', handler);

    showCardPreview({
      dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      filename: 'SWM_Arena_AO_Test.png',
      title: 'สูตรทีมอารีน่า: ทดสอบ',
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0];
    expect(event.detail.filename).toBe('SWM_Arena_AO_Test.png');
    expect(event.detail.title).toBe('สูตรทีมอารีน่า: ทดสอบ');
    expect(event.detail.dataUrl).toContain('data:image/png');

    delete globalThis.window;
    delete globalThis.CustomEvent;
  });

  it('renders CardPreviewModal correctly when open with preview data', () => {
    const html = renderToString(
      React.createElement(CardPreviewModal, {
        isOpen: true,
        cardData: {
          dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          filename: 'SWM_Arena_AO_Seara_Tiana_Galleon_Liebli.png',
          title: 'สูตรทีมอารีน่า: เซอาร่า เทียน่า กัลเลียน ลีบลี',
        },
      })
    );

    expect(html).toContain('สูตรทีมอารีน่า: เซอาร่า เทียน่า กัลเลียน ลีบลี');
    expect(html).toContain('SWM_Arena_AO_Seara_Tiana_Galleon_Liebli.png');
    expect(html).toContain('ดาวน์โหลดรูป (PNG)');
    expect(html).toContain('คัดลอกรูปภาพ');
    expect(html).toContain('คลิกขวาที่รูปเพื่อบันทึกหรือคัดลอกรูปภาพได้โดยตรง');
  });

  it('renders nothing when closed', () => {
    const html = renderToString(
      React.createElement(CardPreviewModal, {
        isOpen: false,
        cardData: null,
      })
    );

    expect(html).toBe('');
  });
});
