// Tourism Feature - Export Module

// Types
export interface DestinationType {
  CITY: 'CITY';
  HISTORICAL_SITE: 'HISTORICAL_SITE';
  NATURAL_LANDMARK: 'NATURAL_LANDMARK';
  RELIGIOUS_SITE: 'RELIGIOUS_SITE';
  MUSEUM: 'MUSEUM';
  BEACH: 'BEACH';
  MOUNTAIN: 'MOUNTAIN';
  PARK: 'PARK';
  MARKET: 'MARKET';
  OTHER: 'OTHER';
}

export interface ActivityType {
  TOUR: 'TOUR';
  EXPERIENCE: 'EXPERIENCE';
  WORKSHOP: 'WORKSHOP';
  ADVENTURE: 'ADVENTURE';
  CULTURAL: 'CULTURAL';
  RELAXATION: 'RELAXATION';
  FOOD_TOUR: 'FOOD_TOUR';
  PHOTOGRAPHY: 'PHOTOGRAPHY';
  WATER_SPORT: 'WATER_SPORT';
  OTHER: 'OTHER';
}

// Destination Labels
export const DESTINATION_TYPE_LABELS: Record<string, { ar: string; icon: string }> = {
  CITY: { ar: 'مدينة', icon: '🏙️' },
  HISTORICAL_SITE: { ar: 'موقع تاريخي', icon: '🏛️' },
  NATURAL_LANDMARK: { ar: 'معلم طبيعي', icon: '🌄' },
  RELIGIOUS_SITE: { ar: 'موقع ديني', icon: '🕌' },
  MUSEUM: { ar: 'متحف', icon: '🏛️' },
  BEACH: { ar: 'شاطئ', icon: '🏖️' },
  MOUNTAIN: { ar: 'جبل', icon: '⛰️' },
  PARK: { ar: 'حديقة', icon: '🌳' },
  MARKET: { ar: 'سوق', icon: '🛍️' },
  OTHER: { ar: 'أخرى', icon: '📍' },
};

// Activity Labels
export const ACTIVITY_TYPE_LABELS: Record<string, { ar: string; icon: string }> = {
  TOUR: { ar: 'جولة', icon: '🚶' },
  EXPERIENCE: { ar: 'تجربة', icon: '✨' },
  WORKSHOP: { ar: 'ورشة عمل', icon: '🛠️' },
  ADVENTURE: { ar: 'مغامرة', icon: '🎯' },
  CULTURAL: { ar: 'ثقافي', icon: '🎭' },
  RELAXATION: { ar: 'استرخاء', icon: '🧘' },
  FOOD_TOUR: { ar: 'جولة طعام', icon: '🍽️' },
  PHOTOGRAPHY: { ar: 'تصوير', icon: '📷' },
  WATER_SPORT: { ar: 'رياضة مائية', icon: '🏄' },
  OTHER: { ar: 'أخرى', icon: '📋' },
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = [
  { value: 'easy', ar: 'سهل', icon: '🟢' },
  { value: 'moderate', ar: 'متوسط', icon: '🟡' },
  { value: 'hard', ar: 'صعب', icon: '🔴' },
];

// Syrian Cities with Destinations
export const SYRIAN_CITIES_INFO = {
  دمشق: { ar: 'دمشق', en: 'Damascus', region: 'جنوب', population: '2.5M', highlights: ['الجامع الأموي', 'الأسواق القديمة', 'القصور الأثرية'] },
  حلب: { ar: 'حلب', en: 'Aleppo', region: 'شمال', population: '2M', highlights: ['قلعة حلب', 'الأسواق', 'الحمامات الأثرية'] },
  حمص: { ar: 'حمص', en: 'Homs', region: 'وسط', population: '800K', highlights: ['قلعة الحصن', 'نواعير حماة القريبة', 'الكنائس التاريخية'] },
  حماة: { ar: 'حماة', en: 'Hama', region: 'وسط', population: '500K', highlights: ['النواعير', 'قلعة حماة', 'الأسواق الشعبية'] },
  اللاذقية: { ar: 'اللاذقية', en: 'Latakia', region: 'ساحل', population: '400K', highlights: ['شواطئ البحر المتوسط', 'قلعة صلاح الدين', 'الميناء'] },
  طرطوس: { ar: 'طرطوس', en: 'Tartus', region: 'ساحل', population: '300K', highlights: ['شاطئ طرطوس', 'جزيرة أرواد', 'المعابد الفينيقية'] },
  تدمر: { ar: 'تدمر', en: 'Palmyra', region: 'شرق', population: '50K', highlights: ['آثار تدمر', 'واحة النخيل', 'قلعة فخر الدين'] },
  معلولا: { ar: 'معلولا', en: 'Maaloula', region: 'جنوب', population: '5K', highlights: ['دير مار تقلا', 'اللغة الآرامية', 'البيوت الجبلية'] },
  السويداء: { ar: 'السويداء', en: 'Suwayda', region: 'جنوب', population: '100K', highlights: ['آثار الجيزة', 'المدن الأثرية', 'الطبيعة الجبلية'] },
};

// Services
export { DestinationService } from './infrastructure/destination-service';
export { ActivityService } from './infrastructure/activity-service';
