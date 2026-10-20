import React, { useState, useEffect, useMemo } from 'react';
import { 
  MessageSquare, 
  MessageCircle, 
  Plus, 
  Search, 
  Filter, 
  Sparkles, 
  Trophy, 
  Shield, 
  Swords, 
  Flame, 
  Clock, 
  Heart, 
  Share2, 
  Send, 
  Pin, 
  Tag, 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  Crown, 
  Award, 
  ExternalLink, 
  X, 
  ChevronRight,
  TrendingUp,
  HelpCircle,
  BookOpen,
  UserPlus,
  ThumbsUp,
  Eye,
  Check
} from 'lucide-react';
import MonsterAvatar from '../components/MonsterAvatar';
import allMonstersData from '../data/allMonsters.json';
import initialPosts from '../data/forumSeeds.json';
import { useAuth } from '../contexts/AuthContext';

const STORAGE_POSTS_KEY = 'swm_webboard_posts_v1';
const STORAGE_LIKES_KEY = 'swm_webboard_likes_v1';

export const FORUM_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', icon: MessageSquare, color: 'text-white' },
  { id: 'rta', label: '⚔️ ปรึกษาจัดทีม RTA', icon: Trophy, color: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { id: 'siege', label: '🛡️ กลยุทธ์ Siege / กิลด์วอร์', icon: Shield, color: 'text-purple-400', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { id: 'runes', label: '💎 รูน & อาร์ติแฟกต์', icon: Sparkles, color: 'text-cyan-400', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { id: 'guild', label: '🏰 กิลด์รับสมัคร / หากิลด์', icon: UserPlus, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { id: 'guides', label: '📖 ไกด์ & เทคนิคการเล่น', icon: BookOpen, color: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { id: 'general', label: '💬 พูดคุยทั่วไป', icon: MessageCircle, color: 'text-slate-300', badgeColor: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
];

export default function CommunityForumView({ onNavigate, initialPostId }) {
  let user = null, isMember = false, isAdmin = false;
  try {
    const auth = useAuth();
    user = auth?.user;
    isMember = auth?.isMember;
    isAdmin = auth?.isAdmin;
  } catch {
    // Graceful fallback when rendered outside AuthProvider
  }

  // Load posts with localStorage persistence
  const [posts, setPosts] = useState(() => {
    if (typeof window === 'undefined') return initialPosts;
    try {
      const saved = localStorage.getItem(STORAGE_POSTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge with initial seeds to keep pinned/system updates
          const savedIds = new Set(parsed.map(p => p.id));
          const missingSeeds = initialPosts.filter(p => !savedIds.has(p.id));
          return [...missingSeeds, ...parsed];
        }
      }
    } catch (err) {
      console.warn('Failed to load forum posts from storage:', err);
    }
    return initialPosts;
  });

  // Track liked post and comment IDs
  const [likedIds, setLikedIds] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem(STORAGE_LIKES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Active view states
  const [selectedPostId, setSelectedPostId] = useState(initialPostId || null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonsterFilter, setSelectedMonsterFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('hot'); // 'hot' | 'newest' | 'replies'
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(null);

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState(() => {
    return user?.email?.split('@')[0] || (typeof window !== 'undefined' ? localStorage.getItem('swm_forum_author') || '' : '');
  });

  // Persist posts to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('Failed to save forum posts:', e);
    }
  }, [posts]);

  // Persist likes to localStorage on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_LIKES_KEY, JSON.stringify(Array.from(likedIds)));
    } catch (e) {
      console.warn('Failed to save forum likes:', e);
    }
  }, [likedIds]);

  // Save author name preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (commentAuthor) {
      try {
        localStorage.setItem('swm_forum_author', commentAuthor);
      } catch {}
    }
  }, [commentAuthor]);

  // Handle Like Post
  const handleToggleLikePost = (postId, e) => {
    if (e) e.stopPropagation();
    const isLiked = likedIds.has(postId);
    const nextLiked = new Set(likedIds);
    if (isLiked) {
      nextLiked.delete(postId);
    } else {
      nextLiked.add(postId);
    }
    setLikedIds(nextLiked);

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: Math.max(0, (p.likes || 0) + (isLiked ? -1 : 1))
        };
      }
      return p;
    }));
  };

  // Handle Share Post
  const handleShare = (postId, e) => {
    if (e) e.stopPropagation();
    const shareUrl = `${window.location.origin}/#community?post=${postId}`;
    navigator.clipboard?.writeText(shareUrl);
    setShareToast('คัดลอกลิงก์กระทู้เรียบร้อยแล้ว!');
    setTimeout(() => setShareToast(null), 2500);
  };

  // Add Comment to active post
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedPostId) return;

    const authorName = commentAuthor.trim() || 'Summoner_' + Math.floor(1000 + Math.random() * 9000);
    const authorRole = isAdmin ? 'admin' : isMember ? 'vip' : 'member';
    const authorBadge = isAdmin ? '🛡️ ผู้ดูแลระบบ' : isMember ? '⭐ VIP Member' : '⚔️ RTA Fighter';

    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        name: authorName,
        role: authorRole,
        badge: authorBadge
      },
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      relativeTime: 'เมื่อสักครู่',
      likes: 0
    };

    setPosts(prev => prev.map(p => {
      if (p.id === selectedPostId) {
        const comments = p.comments || [];
        return {
          ...p,
          comments: [...comments, newComment],
          commentsCount: (p.commentsCount || comments.length) + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    setCommentText('');
  };

  // Filtered & Sorted Posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
      if (selectedMonsterFilter && post.monster?.name !== selectedMonsterFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const titleMatch = (post.title || '').toLowerCase().includes(q);
      const contentMatch = (post.content || '').toLowerCase().includes(q);
      const authorMatch = (post.author?.name || '').toLowerCase().includes(q);
      const tagMatch = (post.tags || []).some(t => t.toLowerCase().includes(q));
      const monsterMatch = (post.monster?.name || '').toLowerCase().includes(q) || (post.monster?.thaiName || '').toLowerCase().includes(q);
      return titleMatch || contentMatch || authorMatch || tagMatch || monsterMatch;
    }).sort((a, b) => {
      // Pinned posts always stay on top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      if (sortBy === 'hot') {
        const scoreA = (a.likes || 0) * 2 + (a.commentsCount || 0) * 3;
        const scoreB = (b.likes || 0) * 2 + (b.commentsCount || 0) * 3;
        return scoreB - scoreA;
      }
      if (sortBy === 'replies') {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      // 'newest'
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [posts, selectedCategory, selectedMonsterFilter, searchQuery, sortBy]);

  // Selected Post Object for Thread Detail View
  const selectedPost = useMemo(() => {
    return posts.find(p => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-16 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4" />
          <span>{shareToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-r from-[#0d1424] via-[#0a0f1d] to-[#070b14] p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono font-bold uppercase">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SWM Community Hub • ศูนย์รวมผู้เล่น Summoners War ไทย</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>เว็บบอร์ด & ชุมชนผู้เล่น</span>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 text-xs font-mono font-black">
              LIVE
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            แลกเปลี่ยนยุทธวิธี ปรึกษาจัดทีม RTA ซีซั่น 39, สูตรเจาะหอ Siege 3MDC, เทคนิคตีบวกรูน และพื้นที่สำหรับกิลด์รับสมัครสมาชิก
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsNewPostModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ ตั้งกระทู้ใหม่</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THREAD DETAIL VIEW (เมื่อเปิดอ่านกระทู้เต็ม) */}
      {/* ======================================================== */}
      {selectedPost ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Back button */}
          <button
            onClick={() => setSelectedPostId(null)}
            className="px-3.5 py-2 rounded-xl bg-[#0c121c] border border-white/10 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
            <span>กลับไปหน้ารวมกระทู้</span>
          </button>

          {/* Post Content Card */}
          <div className="bg-[#101724] border border-[#1d2b3f] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#182333] pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${selectedPost.author?.color || 'from-blue-600 to-indigo-700'} flex items-center justify-center text-white font-black text-sm shadow-md`}>
                  {selectedPost.author?.name ? selectedPost.author.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      {selectedPost.author?.name || 'ผู้เล่นนิรนาม'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#141d2d] text-cyan-300 border border-cyan-500/30">
                      {selectedPost.author?.badge || 'สมาชิก'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{selectedPost.relativeTime || 'ไม่กี่นาทีที่แล้ว'}</span>
                  </div>
                </div>
              </div>

              {/* Category pill */}
              <div className="flex items-center gap-2">
                {selectedPost.isPinned && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                    <Pin className="w-3 h-3 text-amber-400" /> ปักหมุด
                  </span>
                )}
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${FORUM_CATEGORIES.find(c => c.id === selectedPost.category)?.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                  {FORUM_CATEGORIES.find(c => c.id === selectedPost.category)?.label || selectedPost.category}
                </span>
              </div>
            </div>

            {/* Post Title */}
            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {selectedPost.title}
            </h2>

            {/* Attached Monster (if any) */}
            {selectedPost.monster && (
              <div className="p-3.5 rounded-2xl bg-[#0a0f19] border border-cyan-500/30 flex items-center justify-between gap-4 max-w-lg">
                <div className="flex items-center gap-3">
                  <MonsterAvatar monster={selectedPost.monster} size="md" />
                  <div>
                    <div className="text-xs text-slate-400 font-mono">มอนสเตอร์ที่เกี่ยวข้อง:</div>
                    <div className="font-black text-white text-sm">
                      {selectedPost.monster.thaiName || selectedPost.monster.name}
                    </div>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('catalog', { search: selectedPost.monster.name })}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#131d30] hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>ดูสกิล & รูน</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Post Content Body */}
            <div className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-line font-normal space-y-2">
              {selectedPost.content}
            </div>

            {/* Tags */}
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {selectedPost.tags.map((tag, tIdx) => (
                  <span key={tIdx} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#090d16] text-slate-400 border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Interaction Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-[#182333] text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleToggleLikePost(selectedPost.id, e)}
                  className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    likedIds.has(selectedPost.id)
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-500/10'
                      : 'bg-[#0c121c] border border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${likedIds.has(selectedPost.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{selectedPost.likes || 0} ถูกใจ</span>
                </button>

                <button
                  onClick={(e) => handleShare(selectedPost.id, e)}
                  className="px-3.5 py-2 rounded-xl bg-[#0c121c] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>แชร์</span>
                </button>
              </div>

              <div className="text-slate-400 font-mono flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {selectedPost.views || 100} ครั้ง
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-cyan-400" /> {selectedPost.commentsCount || (selectedPost.comments?.length || 0)} คอมเมนต์
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* COMMENTS & DISCUSSION SECTION */}
          {/* ======================================================== */}
          <div className="bg-[#101724] border border-[#1d2b3f] rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              <span>ความคิดเห็นและการร่วมแลกเปลี่ยน ({selectedPost.comments?.length || 0})</span>
            </h3>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="space-y-3 bg-[#0a0f19] p-4 sm:p-5 rounded-2xl border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">แสดงความคิดเห็นในชื่อ:</span>
                  <input
                    type="text"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="ใส่ชื่อหรือฉายาของคุณ..."
                    className="bg-[#101724] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    maxLength={30}
                  />
                </div>
                <span className="text-[11px] text-slate-500">
                  {isAdmin ? '🛡️ ผู้ดูแลระบบ' : isMember ? '⭐ สมาชิก VIP' : 'ผู้เล่นทั่วไป'}
                </span>
              </div>

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="พิมพ์ข้อความ แนะนำเทคนิค หรือตอบคำถามกระทู้นี้..."
                rows={3}
                className="w-full bg-[#101724] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                required
              />

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  โปรดแสดงความคิดเห็นด้วยความสุภาพและสร้างสรรค์
                </span>
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-600/25"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ส่งข้อความ</span>
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-3.5 pt-2">
              {(selectedPost.comments || []).map((c, cIdx) => (
                <div key={c.id || cIdx} className="p-4 rounded-2xl bg-[#090e18] border border-white/5 hover:border-white/10 transition-colors space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                        {c.author?.name ? c.author.name[0].toUpperCase() : 'U'}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {c.author?.name || 'ผู้เล่น'}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#141e2e] text-cyan-300 border border-cyan-500/20">
                        {c.author?.badge || 'สมาชิก'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      {c.relativeTime || 'ไม่นานนี้'}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 whitespace-pre-line pl-9 leading-relaxed">
                    {c.content}
                  </p>
                </div>
              ))}

              {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                <div className="text-center py-8 text-slate-500 text-xs italic">
                  ยังไม่มีความคิดเห็น เป็นคนแรกที่เริ่มการสนทนานี้!
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* FORUM POSTS FEED & LIST VIEW */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#0a0f19]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg overflow-x-auto no-scrollbar scroll-smooth">
            {FORUM_CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedMonsterFilter(null);
                  }}
                  className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${cat.color}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Controls: Search & Sort Filter */}
          <div className="bg-[#101724] p-4 rounded-2xl border border-[#1d2b3f] flex flex-col md:flex-row items-center justify-between gap-3 shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาตามหัวข้อ, เนื้อหา, มอนสเตอร์ หรือชื่อผู้โพสต์..."
                className="w-full bg-[#0c121c] border border-[#1d2b3f] rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Switcher */}
            <div className="flex items-center gap-1.5 self-start md:self-auto text-xs">
              <span className="text-slate-400 font-bold mr-1">เรียงตาม:</span>
              {[
                { id: 'hot', label: '🔥 กำลังฮิต' },
                { id: 'newest', label: '⏱️ ล่าสุด' },
                { id: 'replies', label: '💬 ตอบเยอะสุด' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                      : 'bg-[#0c121c] text-slate-400 hover:text-white border border-[#1d2b3f]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Monster Filter Banner (if any) */}
          {selectedMonsterFilter && (
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between text-xs text-cyan-300">
              <div className="flex items-center gap-2">
                <span>แสดงเฉพาะกระทู้ที่เกี่ยวกับ:</span>
                <span className="font-black text-white px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/30">
                  {selectedMonsterFilter}
                </span>
              </div>
              <button
                onClick={() => setSelectedMonsterFilter(null)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>ล้างตัวกรอง</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Posts Feed Grid */}
          <div className="space-y-3.5">
            {filteredPosts.map(post => {
              const isLiked = likedIds.has(post.id);
              const catObj = FORUM_CATEGORIES.find(c => c.id === post.category);

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className={`bg-[#101724] border rounded-2xl p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl cursor-pointer flex flex-col justify-between group ${
                    post.isPinned 
                      ? 'border-amber-500/40 bg-gradient-to-r from-[#17130b] via-[#101724] to-[#101724] shadow-amber-500/5' 
                      : 'border-[#1d2b3f] hover:border-cyan-500/50'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Author & Meta Category */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${post.author?.color || 'from-blue-600 to-indigo-700'} flex items-center justify-center text-white font-black text-xs shadow-md`}>
                          {post.author?.name ? post.author.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white text-xs sm:text-sm">
                              {post.author?.name || 'ผู้เล่น'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#141e2e] text-cyan-300 border border-cyan-500/20">
                              {post.author?.badge || 'สมาชิก'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {post.relativeTime || 'ไม่กี่นาทีที่แล้ว'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {post.isPinned && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                            <Pin className="w-3 h-3 text-amber-400" /> ปักหมุด
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catObj?.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                          {catObj?.label || post.category}
                        </span>
                      </div>
                    </div>

                    {/* Post Title */}
                    <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    {/* Content Preview */}
                    <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {post.content}
                    </p>

                    {/* Attached Monster (if any) */}
                    {post.monster && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonsterFilter(post.monster.name);
                        }}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#090e18] border border-cyan-500/30 hover:border-cyan-400 text-xs transition-colors"
                        title="คลิกเพื่อกรองกระทู้ที่เกี่ยวกับมอนสเตอร์ตัวนี้"
                      >
                        <MonsterAvatar monster={post.monster} size="xs" />
                        <span className="font-semibold text-slate-200">
                          {post.monster.thaiName || post.monster.name}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-mono">
                          (คลิกกรองกระทู้)
                        </span>
                      </div>
                    )}

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag, tIdx) => (
                          <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c121c] text-slate-400">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer Interaction Bar */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#182333] text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => handleToggleLikePost(post.id, e)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          isLiked 
                            ? 'text-rose-400 font-bold bg-rose-500/10' 
                            : 'hover:text-rose-400 hover:bg-white/5'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>{post.likes || 0}</span>
                      </button>

                      <span className="flex items-center gap-1.5 text-slate-400 group-hover:text-cyan-300 transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{post.commentsCount || (post.comments?.length || 0)} ตอบ</span>
                      </span>

                      <span className="hidden sm:flex items-center gap-1 text-slate-500 font-mono">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{post.views || 50} วิว</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleShare(post.id, e)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="แชร์ลิงก์กระทู้"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                        อ่านต่อ ➔
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPosts.length === 0 && (
              <div className="p-12 text-center rounded-3xl bg-[#0c121c] border border-white/10 space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-600 mx-auto" />
                <div className="font-bold text-white text-base">ไม่พบกระทู้ที่ตรงกับเงื่อนไขการค้นหา</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  ลองเปลี่ยนคำค้นหา หรือเป็นคนแรกที่สร้างกระทู้ใหม่ในหมวดหมู่นี้!
                </p>
                <button
                  onClick={() => setIsNewPostModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                >
                  + ตั้งกระทู้ใหม่เลย
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CREATE NEW POST MODAL */}
      {/* ======================================================== */}
      {isNewPostModalOpen && (
        <CreatePostModal
          onClose={() => setIsNewPostModalOpen(false)}
          defaultAuthor={commentAuthor}
          onSubmitPost={(newPostData) => {
            const created = {
              id: `post-${Date.now()}`,
              ...newPostData,
              createdAt: new Date().toISOString(),
              relativeTime: 'เมื่อสักครู่',
              likes: 1,
              views: 1,
              commentsCount: 0,
              comments: []
            };
            setPosts(prev => [created, ...prev]);
            setIsNewPostModalOpen(false);
            setSelectedPostId(created.id);
          }}
        />
      )}
    </div>
  );
}

// Subcomponent: Create Post Modal
function CreatePostModal({ onClose, onSubmitPost, defaultAuthor }) {
  let user = null, isMember = false, isAdmin = false;
  try {
    const auth = useAuth();
    user = auth?.user;
    isMember = auth?.isMember;
    isAdmin = auth?.isAdmin;
  } catch {}
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('rta');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthor || user?.email?.split('@')[0] || '');
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [monsterSearch, setMonsterSearch] = useState('');
  const [isMonsterPickerOpen, setIsMonsterPickerOpen] = useState(false);

  // Suggested monsters
  const matchedMonsters = useMemo(() => {
    if (!monsterSearch.trim()) return (allMonstersData || []).slice(0, 12);
    const q = monsterSearch.toLowerCase().trim();
    return (allMonstersData || []).filter(m => {
      const nEn = (m.name || '').toLowerCase();
      const nTh = (m.thaiName || '').toLowerCase();
      return nEn.includes(q) || nTh.includes(q);
    }).slice(0, 12);
  }, [monsterSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const finalAuthor = authorName.trim() || 'Summoner_' + Math.floor(1000 + Math.random() * 9000);
    const role = isAdmin ? 'admin' : isMember ? 'vip' : 'member';
    const badge = isAdmin ? '🛡️ ผู้ดูแลระบบ' : isMember ? '⭐ VIP Member' : '⚔️ RTA Fighter';

    const tagList = tags
      .split(/[\s,]+/)
      .map(t => t.trim())
      .filter(Boolean)
      .map(t => (t.startsWith('#') ? t : `#${t}`));

    onSubmitPost({
      title: title.trim(),
      category,
      content: content.trim(),
      tags: tagList,
      author: {
        name: finalAuthor,
        role,
        badge,
        color: isAdmin ? 'from-cyan-500 to-blue-600' : isMember ? 'from-purple-500 to-pink-600' : 'from-blue-600 to-indigo-700'
      },
      monster: selectedMonster ? {
        monsterId: selectedMonster.com2usId || selectedMonster.id,
        name: selectedMonster.name,
        thaiName: selectedMonster.thaiName || selectedMonster.name,
        element: selectedMonster.element,
        avatarUrl: selectedMonster.avatarUrl || selectedMonster.imageUrl
      } : null
    });
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-[#0f1728] border border-cyan-500/30 rounded-3xl shadow-[0_0_60px_rgba(6,182,212,0.15)] overflow-hidden text-slate-200 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">ตั้งกระทู้ใหม่ (New Discussion)</h3>
              <p className="text-xs text-slate-400">แบ่งปันยุทธวิธี ปรึกษาทีม หรือรับสมัครสมาชิก</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* 1. Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              หัวข้อกระทู้ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น แนะนำตัวแก้ทาง Oliver ใน RTA หรือ ขอคำแนะนำรูน Moore..."
              className="w-full bg-[#0a0f19] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              required
              maxLength={120}
            />
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              หมวดหมู่ <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FORUM_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    category === cat.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10'
                      : 'bg-[#0a0f19] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  <cat.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{cat.label.replace(/^[^\s]+\s/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Attach Monster (Optional) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                มอนสเตอร์ที่เกี่ยวข้อง (ไม่บังคับ)
              </label>
              {selectedMonster && (
                <button
                  type="button"
                  onClick={() => setSelectedMonster(null)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  ยกเลิกการเลือก
                </button>
              )}
            </div>

            {selectedMonster ? (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MonsterAvatar monster={selectedMonster} size="sm" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      {selectedMonster.thaiName || selectedMonster.name}
                    </div>
                    <div className="text-[10px] text-cyan-300 font-mono">
                      {selectedMonster.name} ({selectedMonster.element})
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMonsterPickerOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#0c121c] border border-white/10 text-slate-300 hover:text-white"
                >
                  เปลี่ยนตัว
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsMonsterPickerOpen(!isMonsterPickerOpen)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-white/20 bg-[#0a0f19] hover:bg-[#0f172a] text-xs font-semibold text-slate-400 hover:text-cyan-300 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ แนบการ์ดมอนสเตอร์ที่เกี่ยวข้องกับกระทู้</span>
              </button>
            )}

            {/* Monster Picker Tray */}
            {isMonsterPickerOpen && (
              <div className="mt-2 p-3 rounded-2xl bg-[#090d18] border border-white/10 space-y-2.5 animate-in fade-in duration-150">
                <input
                  type="text"
                  value={monsterSearch}
                  onChange={(e) => setMonsterSearch(e.target.value)}
                  placeholder="พิมพ์ชื่อมอนสเตอร์ (ไทย / อังกฤษ)..."
                  className="w-full bg-[#0e1526] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                  {matchedMonsters.map((m, mIdx) => (
                    <button
                      type="button"
                      key={m.id || mIdx}
                      onClick={() => {
                        setSelectedMonster(m);
                        setIsMonsterPickerOpen(false);
                      }}
                      className="p-1.5 rounded-xl bg-[#0e1628] hover:bg-cyan-950/50 border border-white/5 hover:border-cyan-500/40 flex items-center gap-2 transition-all cursor-pointer text-left"
                    >
                      <MonsterAvatar monster={m} size="xs" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{m.thaiName || m.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{m.name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Content Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              เนื้อหากระทู้ <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="เขียนรายละเอียด คำถาม หรือข้อมูลที่ต้องการแบ่งปัน..."
              rows={6}
              className="w-full bg-[#0a0f19] border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
              required
            />
          </div>

          {/* 5. Author & Tags Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ชื่อหรือฉายาของคุณ <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="เช่น CaptainNut"
                className="w-full bg-[#0a0f19] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                แท็ก (คั่นด้วยวรรค หรือ จุลภาค)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="#RTA #Oliver #Runes"
                className="w-full bg-[#0a0f19] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-cyan-500/25 transition-all cursor-pointer"
            >
              โพสต์กระทู้ทันที
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
