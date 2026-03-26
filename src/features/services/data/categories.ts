import { Plane, HeartPulse, GraduationCap, Briefcase, Home, Sparkles, Utensils, Camera, ShoppingBag, Car, LucideIcon } from 'lucide-react';
import { MainCategory } from '../types';

export const MAIN_CATEGORIES: MainCategory[] = [
  {
    id: 'tourism',
    name: 'السياحة',
    description: 'اكتشف جمال سوريا، تاريخها العريق، وطبيعتها الساحرة',
    icon: Plane,
    color: 'emerald',
    image: 'https://images.unsplash.com/photo-1545562083-a600704fa487?auto=format&fit=crop&w=2000&q=80',
    subCategories: [
      { 
        id: 'recreational', 
        name: 'ترفيهية واستجمام', 
        icon: '🏖️',
        subCategories: [
          { id: 'destinations', name: 'الوجهات' },
          { id: 'stays', name: 'الإقامات' },
          { id: 'activities', name: 'الأنشطة' },
          { id: 'services', name: 'الخدمات' }
        ]
      },
      { 
        id: 'cultural', 
        name: 'ثقافية وتاريخية', 
        icon: '🏛️',
        subCategories: [
          { id: 'landmarks', name: 'المعالم' },
          { id: 'services', name: 'الخدمات' },
          { id: 'workshops', name: 'الورش' }
        ]
      },
      { 
        id: 'religious', 
        name: 'دينية وروحانية', 
        icon: '🕌',
        subCategories: [
          { id: 'landmarks', name: 'المعالم' },
          { id: 'services', name: 'الخدمات' },
          { id: 'programs', name: 'البرامج' }
        ]
      },
      { 
        id: 'nature', 
        name: 'طبيعية ومغامرة', 
        icon: '🏔️',
        subCategories: [
          { id: 'landmarks', name: 'المعالم' },
          { id: 'activities', name: 'الأنشطة' },
          { id: 'adventures', name: 'المغامرات' }
        ]
      }
    ]
  },
  {
    id: 'medical',
    name: 'العلاج',
    description: 'رعاية صحية متميزة، أطباء خبراء، ومراكز طبية متقدمة',
    icon: HeartPulse,
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    subCategories: [
      { 
        id: 'medical', 
        name: 'رعاية طبية', 
        icon: '🏥',
        subCategories: [
          { id: 'hospitals', name: 'مستشفيات' },
          { id: 'surgeries', name: 'عمليات جراحية' },
          { id: 'specialized', name: 'علاجات متخصصة' },
          { id: 'diagnosis', name: 'تشخيص ومتابعة' }
        ]
      },
      { 
        id: 'dental', 
        name: 'طب الأسنان', 
        icon: '🦷',
        subCategories: [
          { id: 'clinics', name: 'عيادات متخصصة' },
          { id: 'cosmetic', name: 'تجميل الأسنان' },
          { id: 'implants', name: 'زراعة وتقويم' },
          { id: 'whitening', name: 'تبييض وحشوات' }
        ]
      },
      { 
        id: 'eye', 
        name: 'طب العيون', 
        icon: '👁️',
        subCategories: [
          { id: 'centers', name: 'مراكز دولية' },
          { id: 'lasik', name: 'عمليات الليزر' },
          { id: 'lenses', name: 'عدسات وعلاجات' },
          { id: 'exams', name: 'فحوصات شاملة' }
        ]
      },
      { 
        id: 'alternative', 
        name: 'طب بديل واستشفاء', 
        icon: '🌿',
        subCategories: [
          { id: 'herbal', name: 'مراكز أعشاب' },
          { id: 'natural', name: 'حجامة وعلاجات طبيعية' },
          { id: 'spa', name: 'استشفاء وسبا صحي' },
          { id: 'yoga', name: 'يوغا وتأمل' }
        ]
      },
      {
        id: 'foreign_patients',
        name: 'خدمات المرضى الأجانب',
        icon: '🛠️',
        subCategories: [
          { id: 'arrangements', name: 'ترتيبات العلاج' },
          { id: 'transport', name: 'نقل ومواصلات' },
          { id: 'translation', name: 'ترجمة طبية' },
          { id: 'visas', name: 'تأشيرات علاجية' },
          { id: 'recovery', name: 'إقامة وتعافي' }
        ]
      }
    ]
  },
  {
    id: 'education',
    name: 'الدراسة',
    description: 'جامعات عريقة، معاهد متخصصة، وبرامج تعليمية شاملة',
    icon: GraduationCap,
    color: 'amber',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    subCategories: [
      {
        id: 'foreign_students',
        name: 'خدمات الطلاب',
        icon: '🛠️',
        subCategories: [
          { id: 'visas', name: 'تأشيرات طالب' },
          { id: 'housing', name: 'سكن طلابي' },
          { id: 'insurance', name: 'تأمين صحي' },
          { id: 'transport', name: 'تنقلات' },
          { id: 'support', name: 'دعم أكاديمي' }
        ]
      }
    ]
  },
  {
    id: 'business',
    name: 'الأعمال',
    description: 'فرص استثمارية، شراكات استراتيجية، وخدمات أعمال متكاملة',
    icon: Briefcase,
    color: 'purple',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    subCategories: [
      { 
        id: 'investment', 
        name: 'فرص استثمارية', 
        icon: '💰',
        subCategories: [
          { id: 'realestate', name: 'عقارات' },
          { id: 'tourism', name: 'سياحي' },
          { id: 'industrial', name: 'صناعي' },
          { id: 'commercial', name: 'تجاري' }
        ]
      },
      { 
        id: 'partnerships', 
        name: 'شراكات تجارية', 
        icon: '🤝',
        subCategories: [
          { id: 'commercial', name: 'شراكات تجارية' },
          { id: 'industrial', name: 'شراكات صناعية' },
          { id: 'services', name: 'شراكات خدمات' },
          { id: 'opportunities', name: 'فرص مشتركة' }
        ]
      },
      { 
        id: 'conferences', 
        name: 'مؤتمرات ومعارض', 
        icon: '📅',
        subCategories: [
          { id: 'trade', name: 'معارض تجارية' },
          { id: 'economic', name: 'مؤتمرات اقتصادية' },
          { id: 'workshops', name: 'ورش عمل' },
          { id: 'networking', name: 'فعاليات التواصل' }
        ]
      },
      { 
        id: 'services', 
        name: 'خدمات أعمال', 
        icon: '🏢',
        subCategories: [
          { id: 'offices', name: 'مكاتب مؤقتة' },
          { id: 'meetings', name: 'قاعات اجتماعات' },
          { id: 'admin_legal', name: 'خدمات إدارية وقانونية' },
          { id: 'legal', name: 'استشارات' },
          { id: 'feasibility', name: 'دراسات جدوى' },
          { id: 'translation', name: 'ترجمة معتمدة' },
          { id: 'government', name: 'تسهيلات حكومية' }
        ]
      }
    ]
  },
  {
    id: 'realestate',
    name: 'العقارات',
    description: 'ابحث عن منزلك المثالي أو استثمر في العقارات السورية',
    icon: Home,
    color: 'emerald',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  },
  {
    id: 'experiences',
    name: 'تجارب فريدة',
    description: 'عش لحظات لا تنسى مع تجاربنا المختارة بعناية',
    icon: Sparkles,
    color: 'purple',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  },
  {
    id: 'dining',
    name: 'المطاعم والكافيهات',
    description: 'تذوق أشهى المأكولات السورية والعالمية',
    icon: Utensils,
    color: 'amber',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  },
  {
    id: 'photography',
    name: 'التصوير والفنون',
    description: 'وثق لحظاتك بأيدي محترفين واكتشف الفنون المحلية',
    icon: Camera,
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  },
  {
    id: 'shopping',
    name: 'التسوق',
    description: 'اكتشف الأسواق التقليدية والمراكز التجارية الحديثة',
    icon: ShoppingBag,
    color: 'emerald',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  },
  {
    id: 'transport',
    name: 'النقل والمواصلات',
    description: 'خدمات نقل مريحة وآمنة في جميع أنحاء سوريا',
    icon: Car,
    color: 'blue',
    image: 'https://images.unsplash.com/photo-1449965024634-397f4752c048?auto=format&fit=crop&w=1200&q=80',
    subCategories: []
  }
];

// Helper to get category by ID
export function getCategoryById(id: string): MainCategory | undefined {
  return MAIN_CATEGORIES.find(c => c.id === id);
}

// Get color classes for a category
export function getCategoryColorClasses(color: string) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      border: 'border-emerald-600',
    },
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      bgLight: 'bg-blue-50',
      border: 'border-blue-600',
    },
    amber: {
      bg: 'bg-amber-500',
      text: 'text-amber-600',
      bgLight: 'bg-amber-50',
      border: 'border-amber-500',
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      bgLight: 'bg-purple-50',
      border: 'border-purple-600',
    },
  };
  
  return colorClasses[color as keyof typeof colorClasses] || colorClasses.emerald;
}
