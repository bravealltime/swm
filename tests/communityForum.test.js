import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import CommunityForumView, { FORUM_CATEGORIES } from '../src/views/CommunityForumView';
import forumSeeds from '../src/data/forumSeeds.json';

describe('SWM Webboard & Community Forum View', () => {
  it('forumSeeds contains high-quality initial community posts with categories and comments', () => {
    expect(Array.isArray(forumSeeds)).toBe(true);
    expect(forumSeeds.length).toBeGreaterThan(0);

    const firstPost = forumSeeds[0];
    expect(firstPost).toHaveProperty('id');
    expect(firstPost).toHaveProperty('title');
    expect(firstPost).toHaveProperty('content');
    expect(firstPost).toHaveProperty('category');
    expect(firstPost).toHaveProperty('author');
    expect(Array.isArray(firstPost.comments)).toBe(true);
  });

  it('FORUM_CATEGORIES contains all required gaming & strategy categories', () => {
    const catIds = FORUM_CATEGORIES.map(c => c.id);
    expect(catIds).toContain('all');
    expect(catIds).toContain('rta');
    expect(catIds).toContain('siege');
    expect(catIds).toContain('runes');
    expect(catIds).toContain('guild');
    expect(catIds).toContain('guides');
    expect(catIds).toContain('general');
  });

  it('renders CommunityForumView feed without crashing', () => {
    const html = renderToString(
      React.createElement(CommunityForumView, {
        onNavigate: () => {}
      })
    );

    expect(html).toContain('เว็บบอร์ด &amp; ชุมชนผู้เล่น');
    expect(html).toContain('+ ตั้งกระทู้ใหม่');
    expect(html).toContain('ปรึกษาจัดทีม RTA');
    expect(html).toContain('Oliver');
  });

  it('renders specific post detail thread view when initialPostId is provided', () => {
    const html = renderToString(
      React.createElement(CommunityForumView, {
        onNavigate: () => {},
        initialPostId: 'post-2'
      })
    );

    expect(html).toContain('กลับไปหน้ารวมกระทู้');
    expect(html).toContain('แนะนำตัวแก้ทาง Oliver ใน RTA Season 39');
    expect(html).toContain('ความคิดเห็นและการร่วมแลกเปลี่ยน');
    expect(html).toContain('ส่งข้อความ');
  });
});
