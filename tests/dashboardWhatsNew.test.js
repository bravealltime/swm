import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import DashboardView from '../src/views/DashboardView';

describe('DashboardView What\'s New Hub', () => {
  it('renders the What\'s New Hub section with all updates and hero spotlight', () => {
    const mockNavigate = vi.fn();
    const html = renderToString(React.createElement(DashboardView, { onNavigate: mockNavigate }));

    // Check What's New Section Header
    expect(html).toContain('มีอะไรใหม่ในระบบบ้าง?');
    expect(html).toContain('What&#x27;s New');

    // Check Hero Spotlight (Events & Quiz Solver)
    expect(html).toContain('ศูนย์รวมกิจกรรมในเกม &amp; เฉลยคำถามกิจกรรม');
    expect(html).toContain('Com2uS Events Hub');
    expect(html).toContain('มีเฉลยคำถาม');

    // Check New Feature Cards
    expect(html).toContain('บันทึกแพตช์ 9.4.0');
    expect(html).toContain('Shadow Sailor');
    expect(html).toContain('ระบบตรวจจับการฟาร์มสด');
    expect(html).toContain('AI วินิจฉัยสุขภาพไอดี');
    expect(html).toContain('ศูนย์สงคราม Siege &amp; ทัวร์นาเมนต์ Season 21');
    expect(html).toContain('สูตรทีมบุก &amp; ตั้งรับ Arena');
    expect(html).toContain('โค้ดแจกไอเทมประจำเดือนล่าสุด');
    expect(html).toContain('ตู้สะสม Nat 5 &amp; ทำเนียบ LD 5★ Pokedex');

    // Check Top Hero Announcement Pill
    expect(html).toContain('ศูนย์กิจกรรม &amp; เฉลยคำถาม | Balance Patch 9.4.0');
  });
});
