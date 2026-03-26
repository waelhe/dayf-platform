/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Topic Details Page Client Component
 *
 * صفحة تفاصيل الموضوع في المجتمع - متصلة بالبيانات الحقيقية
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  ChevronLeft,
  Send,
  Loader2,
  User,
  MoreHorizontal,
  ThumbsUp,
  Clock,
  Pin,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Header, Footer, BottomNav } from '@/components/dayf';

// Types matching API response
interface Author {
  id: string;
  displayName: string;
  photoURL?: string;
}

interface Reply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  author?: Author;
  createdAt: string;
  likesCount: number;
}

interface Topic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: Author;
  categoryId: string;
  likesCount: number;
  repliesCount: number;
  isOfficial: boolean;
  createdAt: string;
}

const categoryNames: Record<string, string> = {
  travel: 'سفر وسياحة',
  food: 'طعام ومأكولات',
  culture: 'ثقافة وفنون',
  accommodation: 'إقامة وسكن',
  tips: 'نصائح وإرشادات'
};

// Demo user ID - in production this would come from auth session
const DEMO_USER_ID = 'demo-user';

interface TopicDetailsClientProps {
  topicId: string;
}

export default function TopicDetailsClient({ topicId }: TopicDetailsClientProps) {
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  const fetchTopic = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/topics/${topicId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError('الموضوع غير موجود');
        } else {
          throw new Error('Failed to fetch topic');
        }
        return;
      }

      const data = await response.json();
      setTopic(data.topic);
      setReplies(data.replies || []);
    } catch (err) {
      console.error('Error fetching topic:', err);
      setError('فشل في تحميل الموضوع');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  const submitReply = async () => {
    if (!replyContent.trim() || !topic) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/community/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: topic.id,
          content: replyContent,
          authorId: DEMO_USER_ID
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new reply to the list
        setReplies(prev => [...prev, {
          id: data.replyId || Date.now().toString(),
          topicId: topic.id,
          content: replyContent,
          authorId: DEMO_USER_ID,
          author: { id: DEMO_USER_ID, displayName: 'مستخدم تجريبي' },
          createdAt: new Date().toISOString(),
          likesCount: 0
        }]);
        setReplyContent('');
        toast.success('تم إضافة ردك');
        // Refresh to get accurate data
        fetchTopic();
      } else {
        throw new Error('Failed to submit reply');
      }
    } catch (err) {
      console.error('Error submitting reply:', err);
      toast.error('حدث خطأ أثناء إرسال الرد');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLikeReply = (replyId: string) => {
    setLikedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
        setReplies(prevReplies =>
          prevReplies.map(r =>
            r.id === replyId ? { ...r, likesCount: Math.max(0, r.likesCount - 1) } : r
          )
        );
      } else {
        newSet.add(replyId);
        setReplies(prevReplies =>
          prevReplies.map(r =>
            r.id === replyId ? { ...r, likesCount: r.likesCount + 1 } : r
          )
        );
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading State
  if (loading) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F8F5F0]">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
        <Footer />
      </main>
    );
  }

  // Error / Not Found State
  if (error || !topic) {
    return (
      <main className="min-h-screen flex flex-col bg-[#F8F5F0]">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <MessageCircle className="w-20 h-20 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'الموضوع غير موجود'}
          </h2>
          <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على هذا الموضوع</p>
          <Button onClick={() => router.push('/community')} className="bg-blue-600 hover:bg-blue-700">
            العودة للمجتمع
          </Button>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F5F0]" dir="rtl">
      <Header />

      <div className="flex-1">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link href="/" className="hover:text-blue-600">الرئيسية</Link>
              <ChevronLeft className="w-4 h-4" />
              <Link href="/community" className="hover:text-blue-600">المجتمع</Link>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-gray-900 font-medium truncate">{topic.title}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Topic Header */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            {/* Category & Status Bar */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {categoryNames[topic.categoryId] || topic.categoryId}
                </span>
                {topic.isOfficial && (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    رسمي
                  </span>
                )}
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Author Info */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start gap-4">
                {topic.author?.photoURL ? (
                  <img
                    src={topic.author.photoURL}
                    alt={topic.author.displayName}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {topic.author?.displayName?.charAt(0) || 'م'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg text-gray-900">
                      {topic.author?.displayName || 'مستخدم'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDate(topic.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Topic Content */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{topic.title}</h1>
              <div className="prose prose-lg max-w-none text-gray-700 whitespace-pre-line">
                {topic.content}
              </div>
            </div>

            {/* Topic Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setIsLiked(!isLiked);
                    setTopic(prev => prev ? {
                      ...prev,
                      likesCount: isLiked ? prev.likesCount - 1 : prev.likesCount + 1
                    } : null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    isLiked
                      ? 'bg-red-100 text-red-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{topic.likesCount}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="w-5 h-5" />
                  <span>{topic.repliesCount} رد</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`p-2 rounded-xl transition-all ${
                    isBookmarked
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
                <button className="p-2 bg-white text-gray-600 rounded-xl hover:bg-gray-100 border border-gray-200 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Replies Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">
              الردود ({replies.length})
            </h2>

            {/* Reply Input */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="اكتب ردك هنا..."
                className="min-h-[100px] border-0 focus-visible:ring-0 resize-none text-lg"
              />
              <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                <Button
                  onClick={submitReply}
                  disabled={!replyContent.trim() || submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5 ml-2" />
                      إرسال الرد
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Replies List */}
            <AnimatePresence>
              {replies.length > 0 ? (
                replies.map((reply, index) => (
                  <motion.div
                    key={reply.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-start gap-4">
                      {reply.author?.photoURL ? (
                        <img
                          src={reply.author.photoURL}
                          alt={reply.author.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                          {reply.author?.displayName?.charAt(0) || 'م'}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-900">
                            {reply.author?.displayName || 'مستخدم'}
                          </span>
                          <span className="text-gray-400 text-sm">
                            • {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line">{reply.content}</p>
                        <div className="flex items-center gap-4 mt-4">
                          <button
                            onClick={() => toggleLikeReply(reply.id)}
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              likedReplies.has(reply.id)
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-blue-600'
                            }`}
                          >
                            <ThumbsUp className={`w-4 h-4 ${likedReplies.has(reply.id) ? 'fill-current' : ''}`} />
                            <span>{reply.likesCount}</span>
                          </button>
                          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition-colors">
                            <Flag className="w-4 h-4" />
                            <span>إبلاغ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد ردود</h3>
                  <p className="text-gray-500">كن أول من يرد على هذا الموضوع!</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Footer />
      <BottomNav />
    </main>
  );
}
