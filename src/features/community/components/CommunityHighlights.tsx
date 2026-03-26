'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, MessageSquare, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CommunityTopic } from '../types';

// Categories for display
const CATEGORIES: Record<string, { title: string; color: string }> = {
  'hosting-tips': { title: 'نصائح للمزودين', color: 'bg-amber-100 text-amber-600' },
  'guest-experiences': { title: 'تجارب الضيوف', color: 'bg-blue-100 text-blue-600' },
  'local-groups': { title: 'المجموعات المحلية', color: 'bg-emerald-100 text-emerald-600' },
  'resource-center': { title: 'مركز الموارد', color: 'bg-purple-100 text-purple-600' },
};

export default function CommunityHighlights() {
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await fetch('/api/community/topics?limit=3');
        if (response.ok) {
          const data = await response.json();
          // API returns array directly
          setTopics(Array.isArray(data) ? data : (data.topics || []));
        }
      } catch (error) {
        console.error('Error fetching community highlights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
        </div>
      </section>
    );
  }

  if (topics.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs">مجتمع ضيف</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">تواصل مع المجتمع</h2>
            <p className="text-gray-600">
              اكتشف تجارب الآخرين، اطرح أسئلتك، واحصل على توصيات من خبراء محليين وضيوف سابقين.
            </p>
          </div>
          <Link 
            href="/community" 
            className="inline-flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition-colors shrink-0"
          >
            <span>تصفح كل النقاشات</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-6 pb-4">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 hover:shadow-md transition-shadow flex flex-col w-[200px] shrink-0"
            >
              <div className="flex items-center gap-2 mb-3">
                <img 
                  src={topic.authorAvatar || `https://ui-avatars.com/api/?name=${topic.authorName}&background=random`} 
                  alt={topic.authorName} 
                  className="w-8 h-8 rounded-full border border-gray-100"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-gray-900 text-[10px] truncate">{topic.authorName}</h4>
                  <span className="text-[9px] text-gray-500 block">
                    {new Date(topic.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-1">
                {topic.title}
              </h3>
              <p className="text-gray-600 text-[11px] mb-3 line-clamp-2 flex-1">
                {topic.content}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {topic.repliesCount}
                  </span>
                </div>
                <Link 
                  href="/community" 
                  className="text-emerald-600 text-[10px] font-bold hover:underline"
                >
                  اقرأ المزيد
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
