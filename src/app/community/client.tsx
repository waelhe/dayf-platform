'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, MessageSquare, Users, BookOpen, Award, TrendingUp, ThumbsUp, 
  MessageCircle, ChevronLeft, X, Plus, Map, Clock, Compass, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_USER_ID = 'demo-user';

const CATEGORIES = [
  {
    id: 'hosting-tips',
    title: 'نصائح للمزودين',
    description: 'تبادل الخبرات حول كيفية تحسين خدماتك وزيادة نسبة الإشغال.',
    icon: Award,
    color: 'bg-amber-100 text-amber-600',
  },
  {
    id: 'guest-experiences',
    title: 'تجارب الضيوف',
    description: 'شارك تجربتك الإيجابية، واقترح أماكن جديدة لضيوف آخرين.',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'local-groups',
    title: 'المجموعات المحلية',
    description: 'تواصل مع مزودين وضيوف في مدينتك أو تخصصك.',
    icon: Users,
    color: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'resource-center',
    title: 'مركز الموارد',
    description: 'أدلة إرشادية، أفضل الممارسات، وأخبار منصة ضيف.',
    icon: BookOpen,
    color: 'bg-purple-100 text-purple-600',
  }
];

const TRAVEL_GUIDES = [
  {
    id: 'damascus',
    title: 'دليل دمشق القديمة',
    description: 'اكتشف سحر أقدم عاصمة مأهولة في التاريخ، من الجامع الأموي إلى سوق الحميدية وحارات الشام العتيقة.',
    image: 'https://images.unsplash.com/photo-1585282760623-14660851452c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '15 دقيقة',
    author: 'فريق ضيف',
    tags: ['تاريخ', 'تسوق', 'طعام']
  },
  {
    id: 'aleppo',
    title: 'اكتشف حلب الشهباء',
    description: 'عاصمة الطرب والذواقة. دليلك الشامل لقلعة حلب، أسواقها التاريخية، وأشهر مطاعمها.',
    image: 'https://images.unsplash.com/photo-1610312278520-bcc893a3ff1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '12 دقيقة',
    author: 'أحمد الحلبي',
    tags: ['ثقافة', 'مطبخ', 'تراث']
  },
  {
    id: 'coast',
    title: 'لؤلؤة الساحل السوري',
    description: 'رحلة عبر شواطئ اللاذقية وطرطوس، وجولة في جبال الساحل الخضراء وقلاعها التاريخية كقلعة صلاح الدين.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '20 دقيقة',
    author: 'فريق ضيف',
    tags: ['طبيعة', 'استجمام', 'بحر']
  },
  {
    id: 'palmyra',
    title: 'عروس الصحراء: تدمر',
    description: 'دليل زيارة آثار تدمر العظيمة، معبد بل، والمسرح الروماني، وتجربة التخييم في البادية.',
    image: 'https://images.unsplash.com/photo-1600255821058-c4f89958d700?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '10 دقيقة',
    author: 'سارة الدمشقي',
    tags: ['آثار', 'مغامرة', 'تاريخ']
  }
];

const TOP_CONTRIBUTORS = [
  { name: 'أحمد الحمصي', points: 1250, badge: 'خبير سياحي', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { name: 'سارة الدمشقي', points: 980, badge: 'مرشدة طبية', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
  { name: 'محمد الحلبي', points: 850, badge: 'مستشار أعمال', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80' },
];

interface Topic {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  likesCount: number;
  repliesCount: number;
  isOfficial?: boolean;
  createdAt: string;
}

export default function CommunityClient() {
  const [activeTab, setActiveTab] = useState<'discussions' | 'guides'>('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', categoryId: CATEGORIES[0].id });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, [selectedCategory]);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const url = selectedCategory 
        ? `/api/community/topics?categoryId=${selectedCategory}`
        : '/api/community/topics';
      const response = await fetch(url);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/community/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTopic.title,
          content: newTopic.content,
          categoryId: newTopic.categoryId,
          authorId: DEMO_USER_ID,
          authorName: 'مستخدم ضيف',
        }),
      });

      if (response.ok) {
        toast.success('تم نشر الموضوع بنجاح');
        setIsModalOpen(false);
        setNewTopic({ title: '', content: '', categoryId: CATEGORIES[0].id });
        fetchTopics();
      }
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('حدث خطأ أثناء نشر الموضوع');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (topicId: string) => {
    try {
      await fetch(`/api/community/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'like' }),
      });
      fetchTopics();
    } catch (error) {
      console.error('Error liking topic:', error);
    }
  };

  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    topic.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGuides = TRAVEL_GUIDES.filter(guide => 
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    guide.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.tags.some(tag => tag.includes(searchQuery))
  );

  const formatTimeAgo = (timestamp: string | Date) => {
    if (!timestamp) return 'الآن';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'منذ لحظات';
    if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
    if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
    return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12" dir="rtl">
      {/* Hero Section */}
      <div className="bg-emerald-950 text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-sm font-bold mb-8 border border-emerald-400/20"
          >
            <Users className="w-4 h-4" />
            <span>ملتقى ضيوف ومزودي سوريا</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
          >
            مجتمع <span className="text-emerald-400">ضيف</span> التفاعلي
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            تواصل، شارك خبراتك، واكتشف أدلة السفر الشاملة لجميع مناطق سوريا مع آلاف الأعضاء.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative mb-12"
          >
            <div className="relative group">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder={activeTab === 'discussions' ? "ابحث في النقاشات والمجموعات..." : "ابحث عن مدينة، معلم، أو دليل سفر..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-md text-white rounded-2xl py-5 pr-14 pl-12 focus:outline-none focus:bg-white focus:text-gray-900 border border-white/10 focus:border-emerald-500 shadow-2xl text-lg placeholder:text-gray-400 transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>

          {/* Navigation Tabs */}
          <div className="flex justify-center gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                activeTab === 'discussions' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              النقاشات والمجتمع
            </button>
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-lg ${
                activeTab === 'guides' 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Map className="w-5 h-5" />
              أدلة السفر
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {activeTab === 'discussions' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-12">
              
              {/* Categories Grid */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">تصفح الأقسام</h2>
                  {selectedCategory && (
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="text-sm text-emerald-600 hover:underline"
                    >
                      عرض كل الأقسام
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CATEGORIES.map((category, index) => (
                    <motion.div 
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`bg-white p-6 rounded-2xl shadow-sm border transition-all cursor-pointer group ${
                        selectedCategory === category.id ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-100 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl ${category.color}`}>
                          <category.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-bold mb-1 transition-colors ${
                            selectedCategory === category.id ? 'text-emerald-700' : 'text-gray-900 group-hover:text-emerald-600'
                          }`}>
                            {category.title}
                          </h3>
                          <p className="text-sm text-gray-500 mb-3 leading-relaxed">
                            {category.description}
                          </p>
                          <div className="flex items-center text-xs font-medium text-gray-400">
                            <MessageSquare className="w-3 h-3 ml-1" />
                            {topics.filter(t => t.categoryId === category.id).length} موضوع
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Trending Topics */}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                    {selectedCategory ? `نقاشات: ${CATEGORIES.find(c => c.id === selectedCategory)?.title}` : 'أحدث النقاشات'}
                  </h2>
                  
                  {/* Mobile Create Button (Top) */}
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="lg:hidden w-full sm:w-auto bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    ابدأ نقاشاً جديداً
                  </button>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {loading ? (
                    <div className="p-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                    </div>
                  ) : filteredTopics.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">لا توجد مواضيع مطابقة للبحث.</div>
                  ) : (
                    filteredTopics.map((topic, index) => (
                      <div 
                        key={topic.id} 
                        className={`p-6 hover:bg-gray-50 transition-colors ${
                          index !== filteredTopics.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <img 
                            src={topic.authorAvatar || `https://ui-avatars.com/api/?name=${topic.authorName}&background=random`} 
                            alt={topic.authorName} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                {CATEGORIES.find(c => c.id === topic.categoryId)?.title || 'عام'}
                              </span>
                              {topic.isOfficial && (
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                  إعلان رسمي
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{formatTimeAgo(topic.createdAt)}</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2 cursor-pointer hover:text-emerald-600 transition-colors">
                              {topic.title}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{topic.content}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="font-medium text-gray-700">{topic.authorName}</span>
                              <button 
                                onClick={() => handleLike(topic.id)}
                                className="flex items-center gap-1 hover:text-emerald-600 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                {topic.likesCount}
                              </button>
                              <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                {topic.repliesCount}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Call to Action */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="font-bold text-xl mb-2">لديك سؤال أو تجربة؟</h3>
                <p className="text-emerald-100 text-sm mb-6 leading-relaxed">
                  شارك أفكارك مع مجتمع ضيف، واحصل على إجابات من خبراء ومزودين محليين.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full bg-white text-emerald-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  ابدأ نقاشاً جديداً
                </button>
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  أبرز المساهمين هذا الأسبوع
                </h3>
                <div className="space-y-4">
                  {TOP_CONTRIBUTORS.map((user, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                          {i + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-900">{user.name}</h4>
                        <p className="text-xs text-gray-500">{user.badge}</p>
                      </div>
                      <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                        {user.points} نقطة
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Travel Guides Tab Content */
          <div className="space-y-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <Compass className="w-8 h-8 text-emerald-600" />
                  أدلة السفر الشاملة
                </h2>
                <p className="text-gray-600 text-lg">اكتشف أجمل الوجهات السياحية في سوريا مع أدلة مفصلة أعدها خبراء محليون.</p>
              </div>
            </div>

            {filteredGuides.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
                <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد أدلة مطابقة</h3>
                <p className="text-gray-500">حاول البحث باستخدام كلمات مختلفة.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {filteredGuides.map((guide, index) => (
                  <motion.div
                    key={guide.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group flex flex-col h-full"
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={guide.image} 
                        alt={guide.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-4 right-4 left-4 flex justify-between items-end">
                        <div className="flex gap-2 flex-wrap">
                          {guide.tags.map(tag => (
                            <span key={tag} className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/30">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {guide.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {guide.author}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                        {guide.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-6 flex-1">
                        {guide.description}
                      </p>
                      <button className="w-full bg-gray-50 text-emerald-700 font-bold py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white">
                        قراءة الدليل كاملاً
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile FAB for Create Topic (Only in discussions tab) */}
      {activeTab === 'discussions' && (
        <button
          onClick={() => setIsModalOpen(true)}
          className="lg:hidden fixed bottom-8 left-8 z-[60] bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-700 transition-transform active:scale-95 flex items-center justify-center ring-4 ring-emerald-100"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Create Topic Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">موضوع جديد</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTopic} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    عنوان الموضوع
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="اكتب عنواناً واضحاً وموجزاً..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    القسم
                  </label>
                  <select
                    value={newTopic.categoryId}
                    onChange={(e) => setNewTopic({ ...newTopic, categoryId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المحتوى
                  </label>
                  <textarea
                    required
                    maxLength={5000}
                    rows={6}
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    placeholder="اكتب تفاصيل موضوعك هنا..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? 'جاري النشر...' : 'نشر الموضوع'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
