// Initial services data for seeding - Syrian Tourism Platform
// البيانات الأولية للخدمات - منصة ضيف للسياحة السورية

export interface InitialService {
  id: string;
  mainCategoryId: string;
  subCategoryId: string;
  subSubCategoryId?: string;
  title: string;
  location: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  images: string[];
  type: string;
  description: string;
  amenities: string[];
  features: string[];
  isPopular: boolean;
  host?: {
    name: string;
    isSuperhost: boolean;
    avatar: string;
  };
}

export const INITIAL_SERVICES: InitialService[] = [
  // ================= TOURISM - RECREATIONAL =================
  {
    id: 't1',
    mainCategoryId: 'tourism',
    subCategoryId: 'recreational',
    subSubCategoryId: 'stays',
    title: 'منتجع الرمال الذهبية الفاخر',
    location: 'طرطوس، الشاطئ الأزرق',
    price: 150,
    originalPrice: 200,
    rating: 4.9,
    reviews: 320,
    images: [
      'https://picsum.photos/seed/tartous-resort-1/800/600',
      'https://picsum.photos/seed/tartous-resort-2/800/600'
    ],
    type: 'منتجع',
    description: 'استمتع بإقامة فاخرة في منتجع الرمال الذهبية، حيث الهدوء والرفاهية. يتميز المنتجع بإطلالات خلابة على البحر الأبيض المتوسط وخدمات عالمية المستوى تشمل سبا متكامل ومطاعم متنوعة.',
    amenities: ['مسبح خاص', 'واي فاي سريع', 'إطلالة بحرية', 'سبا ومساج', 'موقف سيارات مجاني', 'مطعم فاخر'],
    features: ['إلغاء مجاني', 'حجز فوري'],
    isPopular: true,
    host: { name: 'إدارة المنتجع', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=t1' }
  },
  {
    id: 't2',
    mainCategoryId: 'tourism',
    subCategoryId: 'recreational',
    subSubCategoryId: 'destinations',
    title: 'جولة القوارب في جزيرة أرواد',
    location: 'طرطوس، جزيرة أرواد',
    price: 25,
    rating: 4.7,
    reviews: 85,
    images: ['https://picsum.photos/seed/arwad-island/800/600'],
    type: 'جولة بحرية',
    description: 'رحلة بحرية ساحرة إلى جزيرة أرواد التاريخية. اكتشف القلعة القديمة والأزقة الضيقة واستمتع بالمأكولات البحرية الطازجة في قلب البحر.',
    amenities: ['مرشد سياحي', 'سترات نجاة', 'وجبة خفيفة'],
    features: ['مناسب للأطفال'],
    isPopular: false,
    host: { name: 'الكابتن علي', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=t2' }
  },
  {
    id: 't3',
    mainCategoryId: 'tourism',
    subCategoryId: 'recreational',
    subSubCategoryId: 'stays',
    title: 'شاليهات النورس الملكية',
    location: 'اللاذقية، وادي قنديل',
    price: 120,
    rating: 4.8,
    reviews: 210,
    images: ['https://picsum.photos/seed/latakia-chalet/800/600'],
    type: 'شاليه',
    description: 'شاليهات عصرية تقع مباشرة على شاطئ وادي قنديل الساحر. مثالية للعائلات التي تبحث عن الخصوصية والاستمتاع بجمال الطبيعة الجبلية والبحرية معاً.',
    amenities: ['شاطئ خاص', 'مطبخ كامل', 'تكييف'],
    features: ['إلغاء مجاني'],
    isPopular: true,
    host: { name: 'شركة النورس', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=t3' }
  },

  // ================= TOURISM - CULTURAL =================
  {
    id: 't4',
    mainCategoryId: 'tourism',
    subCategoryId: 'cultural',
    subSubCategoryId: 'landmarks',
    title: 'فندق بيت المملوكة التراثي',
    location: 'دمشق، باب توما',
    price: 95,
    rating: 4.9,
    reviews: 180,
    images: ['https://picsum.photos/seed/damascus-heritage-hotel/800/600'],
    type: 'فندق تراثي',
    description: 'عيش تجربة الدمشقيين القدامى في هذا البيت التراثي الذي يعود تاريخه لمئات السنين. يتميز بباحة سماوية واسعة ونوافير مياه وأجواء هادئة في قلب المدينة القديمة.',
    amenities: ['فطور دمشقي', 'فناء داخلي', 'واي فاي'],
    features: ['مبنى تاريخي'],
    isPopular: true,
    host: { name: 'عائلة المملوكة', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=t4' }
  },
  {
    id: 't5',
    mainCategoryId: 'tourism',
    subCategoryId: 'cultural',
    subSubCategoryId: 'workshops',
    title: 'ورشة تعليم صناعة الموزاييك',
    location: 'دمشق، التكية السليمانية',
    price: 40,
    rating: 4.6,
    reviews: 55,
    images: ['https://picsum.photos/seed/damascus-mosaic-workshop/800/600'],
    type: 'ورشة عمل',
    description: 'تعلم فن الموزاييك الدمشقي العريق على يد أمهر الحرفيين. ستتعلم كيفية تقطيع الخشب وتنزيل الصدف وصناعة قطعة فنية خاصة بك لتأخذها معك.',
    amenities: ['المواد الأولية', 'شهادة حضور'],
    features: ['صناعة يدوية'],
    isPopular: false,
    host: { name: 'الحرفي أبو محمد', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=t5' }
  },

  // ================= TOURISM - NATURE =================
  {
    id: 't6',
    mainCategoryId: 'tourism',
    subCategoryId: 'nature',
    subSubCategoryId: 'adventures',
    title: 'رحلة تخييم في غابات كسب',
    location: 'اللاذقية، كسب',
    price: 50,
    rating: 4.8,
    reviews: 42,
    images: ['https://picsum.photos/seed/kasab-forest/800/600'],
    type: 'مغامرة',
    description: 'استكشف جمال غابات كسب الخضراء في رحلة تخييم منظمة. تشمل الرحلة مسارات مشي جبلية، سهرات نار، وتجربة النوم تحت النجوم في أنقى هواء.',
    amenities: ['خيمة مجهزة', 'وجبات طعام', 'مرشد جبلي'],
    features: ['إطلالة جبلية'],
    isPopular: true,
    host: { name: 'فريق مغامرة', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=t6' }
  },
  {
    id: 't7',
    mainCategoryId: 'tourism',
    subCategoryId: 'nature',
    subSubCategoryId: 'landmarks',
    title: 'زيارة مغارة الضوايات',
    location: 'طرطوس، مشتى الحلو',
    price: 15,
    rating: 4.5,
    reviews: 120,
    images: ['https://picsum.photos/seed/tartous-cave/800/600'],
    type: 'معلم طبيعي',
    description: 'اكتشف عجائب الطبيعة في مغارة الضوايات، إحدى أقدم المغارات في المنطقة. استمتع بمشاهدة الصواعد والنوازل الكلسية المذهلة في أجواء باردة ومنعشة.',
    amenities: ['تذاكر دخول', 'مرشد'],
    features: ['مناسب للعائلات'],
    isPopular: false,
    host: { name: 'بلدية مشتى الحلو', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=t7' }
  },

  // ================= MEDICAL - DENTAL =================
  {
    id: 'm1',
    mainCategoryId: 'medical',
    subCategoryId: 'dental',
    subSubCategoryId: 'cosmetic',
    title: 'مركز ابتسامة الشام لطب وتجميل الأسنان',
    location: 'دمشق، المزة',
    price: 1200,
    originalPrice: 1500,
    rating: 4.9,
    reviews: 412,
    images: ['https://picsum.photos/seed/damascus-dental-clinic/800/600'],
    type: 'عيادة تخصصية',
    description: 'نقدم أحدث تقنيات تجميل الأسنان وزراعتها. فريقنا الطبي يضم نخبة من الأطباء المتخصصين لضمان حصولك على ابتسامة مثالية بأعلى معايير الجودة العالمية.',
    amenities: ['أشعة بانورامية', 'تخدير بدون ألم', 'تعقيم دولي'],
    features: ['حجز موعد فوري'],
    isPopular: true,
    host: { name: 'د. سامر', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=m1' }
  },
  {
    id: 'm2',
    mainCategoryId: 'medical',
    subCategoryId: 'dental',
    subSubCategoryId: 'implants',
    title: 'مركز النخبة لزراعة الأسنان',
    location: 'حلب، الفرقان',
    price: 800,
    rating: 4.8,
    reviews: 156,
    images: ['https://picsum.photos/seed/aleppo-dental-clinic/800/600'],
    type: 'مركز زراعة',
    description: 'متخصصون في زراعة الأسنان الفورية والتقليدية باستخدام أفضل أنواع الزرعات السويسرية والألمانية. نضمن لك استعادة وظيفة وجمال أسنانك في وقت قياسي.',
    amenities: ['زراعة فورية', 'ضمان مدى الحياة'],
    features: ['أحدث التقنيات'],
    isPopular: false,
    host: { name: 'د. يحيى', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=m2' }
  },

  // ================= MEDICAL - EYE =================
  {
    id: 'm3',
    mainCategoryId: 'medical',
    subCategoryId: 'eye',
    subSubCategoryId: 'lasik',
    title: 'المركز الدولي لليزك وجراحة العيون',
    location: 'دمشق، كفرسوسة',
    price: 500,
    rating: 5.0,
    reviews: 850,
    images: ['https://picsum.photos/seed/damascus-eye-clinic/800/600'],
    type: 'مركز جراحي',
    description: 'ودع النظارات الطبية للأبد مع أحدث أجهزة الفيمتو ليزك. المركز مجهز بأحدث التقنيات التشخيصية والجراحية لعلاج كافة مشاكل الإبصار تحت إشراف كبار الاستشاريين.',
    amenities: ['فيمتو ليزك', 'فحوصات شاملة'],
    features: ['نتائج مضمونة'],
    isPopular: true,
    host: { name: 'د. ريم', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=m3' }
  },

  // ================= MEDICAL - ALTERNATIVE =================
  {
    id: 'm4',
    mainCategoryId: 'medical',
    subCategoryId: 'alternative',
    subSubCategoryId: 'spa',
    title: 'مركز استشفاء حمام الملك الظاهر',
    location: 'دمشق، دمشق القديمة',
    price: 30,
    rating: 4.7,
    reviews: 210,
    images: ['https://picsum.photos/seed/damascus-hammam/800/600'],
    type: 'حمام تراثي',
    description: 'استمتع بجلسة استرخاء واستشفاء في واحد من أعرق حمامات دمشق. خدماتنا تشمل التكييس والتدليك بالزيوت الطبيعية في أجواء تاريخية ساحرة تعيد لك الحيوية والنشاط.',
    amenities: ['تدليك', 'بخار', 'ليفة وصابون غار'],
    features: ['تجربة تاريخية'],
    isPopular: true,
    host: { name: 'إدارة الحمام', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=m4' }
  },

  // ================= EDUCATION - STUDENT SERVICES =================
  {
    id: 'e1',
    mainCategoryId: 'education',
    subCategoryId: 'foreign_students',
    subSubCategoryId: 'support',
    title: 'مكتب خدمات الطلاب الدوليين',
    location: 'دمشق، البرامكة',
    price: 50,
    rating: 4.9,
    reviews: 120,
    images: ['https://picsum.photos/seed/student-services/800/600'],
    type: 'خدمات طلابية',
    description: 'نحن شريكك الموثوق للدراسة في سوريا. نقدم خدمات شاملة تشمل القبولات الجامعية، معادلة الشهادات، استخراج التأشيرات، وتأمين السكن الطلابي المناسب.',
    amenities: ['استشارات أكاديمية', 'تأمين سكن', 'تأشيرات'],
    features: ['دعم متواصل'],
    isPopular: true,
    host: { name: 'مكتب الطالب', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=e1' }
  },
  {
    id: 'e2',
    mainCategoryId: 'education',
    subCategoryId: 'foreign_students',
    subSubCategoryId: 'housing',
    title: 'سكن الياسمين للطلاب',
    location: 'دمشق، المزة',
    price: 150,
    rating: 4.7,
    reviews: 45,
    images: ['https://picsum.photos/seed/student-housing/800/600'],
    type: 'سكن طلابي',
    description: 'سكن طلابي حديث وآمن يقع في منطقة المزة الحيوية بالقرب من جامعة دمشق. غرف مجهزة بالكامل مع خدمات تنظيف وإنترنت سريع لضمان بيئة دراسية مثالية.',
    amenities: ['إنترنت', 'تكييف', 'قريب من الجامعة'],
    features: ['بيئة هادئة'],
    isPopular: false,
    host: { name: 'إدارة السكن', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=e2' }
  },

  // ================= BUSINESS - INVESTMENT =================
  {
    id: 'b1',
    mainCategoryId: 'business',
    subCategoryId: 'investment',
    subSubCategoryId: 'realestate',
    title: 'فرص استثمار عقاري في ماروتا سيتي',
    location: 'دمشق، ماروتا سيتي',
    price: 50000,
    rating: 4.7,
    reviews: 34,
    images: ['https://picsum.photos/seed/marota-city-investment/800/600'],
    type: 'استثمار',
    description: 'استثمر في مستقبل دمشق الحديثة. نقدم فرصاً استثمارية متميزة في مشروع ماروتا سيتي، مع دراسات جدوى شاملة واستشارات قانونية لضمان أفضل العوائد.',
    amenities: ['دراسة جدوى', 'استشارات قانونية'],
    features: ['عائد مرتفع'],
    isPopular: true,
    host: { name: 'شركة إعمار الشام', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=b1' }
  },

  // ================= BUSINESS - SERVICES =================
  {
    id: 'b2',
    mainCategoryId: 'business',
    subCategoryId: 'services',
    subSubCategoryId: 'offices',
    title: 'مساحة عمل مشتركة (Damascus Hub)',
    location: 'دمشق، كفرسوسة',
    price: 25,
    rating: 4.9,
    reviews: 120,
    images: ['https://picsum.photos/seed/damascus-hub/800/600'],
    type: 'مساحة عمل',
    description: 'المكان المثالي لرواد الأعمال والمستقلين. نوفر بيئة عمل ملهمة مع إنترنت فائق السرعة، قاعات اجتماعات مجهزة، ومجتمع حيوي من المبدعين.',
    amenities: ['إنترنت سريع', 'قهوة مجانية', 'قاعات اجتماعات'],
    features: ['دخول 24/7'],
    isPopular: true,
    host: { name: 'Damascus Hub', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=b2' }
  },
  {
    id: 'b3',
    mainCategoryId: 'business',
    subCategoryId: 'services',
    subSubCategoryId: 'admin_legal',
    title: 'مكتب الشام للخدمات الإدارية والقانونية',
    location: 'دمشق، المرجة',
    price: 100,
    rating: 4.8,
    reviews: 56,
    images: ['https://picsum.photos/seed/legal-services/800/600'],
    type: 'مكتب خدمات',
    description: 'نسهل لك كافة الإجراءات الإدارية والقانونية لتأسيس وتشغيل عملك في سوريا. خبرة طويلة في التعامل مع الدوائر الرسمية وتخليص المعاملات بدقة وسرعة.',
    amenities: ['تراخيص تجارية', 'عقود قانونية', 'تسهيلات إدارية'],
    features: ['خبرة واسعة'],
    isPopular: false,
    host: { name: 'أ. محمود', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=b3' }
  },
  {
    id: 'b4',
    mainCategoryId: 'business',
    subCategoryId: 'services',
    subSubCategoryId: 'legal',
    title: 'مكتب الاستشارات القانونية التخصصي',
    location: 'دمشق، السبع بحرات',
    price: 75,
    rating: 5.0,
    reviews: 88,
    images: ['https://picsum.photos/seed/consultancy/800/600'],
    type: 'مكتب استشارات',
    description: 'نخبة من المحامين والمستشارين القانونيين في خدمتك. متخصصون في القضايا التجارية، العقارية، والمدنية، مع تقديم استشارات دقيقة تحمي مصالحك.',
    amenities: ['استشارات مدنية', 'استشارات تجارية'],
    features: ['دقة وسرعة'],
    isPopular: true,
    host: { name: 'د. ليلى', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=b4' }
  },

  // ================= EXPERIENCES =================
  {
    id: 'ex1',
    mainCategoryId: 'experiences',
    subCategoryId: 'culture',
    subSubCategoryId: 'tours',
    title: 'جولة في أسواق دمشق القديمة',
    location: 'دمشق، سوق الحميدية',
    price: 15,
    rating: 4.9,
    reviews: 156,
    images: ['https://picsum.photos/seed/damascus-old-souq/800/600'],
    type: 'جولة مشي',
    description: 'انغمس في عبق التاريخ مع جولة مشي في أقدم مدينة مأهولة في العالم. سنزور سوق الحميدية، الجامع الأموي، وقصر العظم، مع تذوق أشهر الحلويات الدمشقية.',
    amenities: ['مرشد سياحي', 'تذوق حلويات'],
    features: ['تجربة محلية'],
    isPopular: true,
    host: { name: 'أبو أحمد', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=ex1' }
  },

  // ================= REAL ESTATE =================
  {
    id: 'r1',
    mainCategoryId: 'realestate',
    subCategoryId: 'residential',
    subSubCategoryId: 'apartments',
    title: 'شقة فاخرة للإيجار في مشروع دمر',
    location: 'دمشق، مشروع دمر',
    price: 1200,
    rating: 4.8,
    reviews: 12,
    images: ['https://picsum.photos/seed/damascus-apartment/800/600'],
    type: 'شقة',
    description: 'شقة واسعة ومفروشة بأناقة في أرقى مناطق مشروع دمر. تتميز بإطلالة جبلية رائعة، تدفئة مركزية، وتجهيزات مطبخ حديثة، مثالية للعائلات أو الدبلوماسيين.',
    amenities: ['مفروشة بالكامل', 'تدفئة مركزية', 'موقف سيارات'],
    features: ['إطلالة جبلية'],
    isPopular: true,
    host: { name: 'عقارات الشام', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=r1' }
  },
  {
    id: 't8',
    mainCategoryId: 'tourism',
    subCategoryId: 'recreational',
    subSubCategoryId: 'stays',
    title: 'فيلا الياسمين الخاصة',
    location: 'ريف دمشق، يعفور',
    price: 250,
    rating: 5.0,
    reviews: 15,
    images: ['https://picsum.photos/seed/yafour-villa/800/600'],
    type: 'فيلا',
    description: 'اهرب من ضجيج المدينة إلى هدوء يعفور. فيلا خاصة فاخرة مع مسبح كبير وحديقة منسقة، مثالية لقضاء عطلة نهاية الأسبوع مع العائلة والأصدقاء بخصوصية تامة.',
    amenities: ['مسبح خاص', 'حديقة واسعة', 'منطقة شواء'],
    features: ['خصوصية تامة'],
    isPopular: true,
    host: { name: 'أبو وائل', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=t8' }
  },
  {
    id: 'm5',
    mainCategoryId: 'medical',
    subCategoryId: 'general',
    subSubCategoryId: 'checkup',
    title: 'مشفى الشامي - قسم الفحص الشامل',
    location: 'دمشق، المالكي',
    price: 300,
    rating: 4.9,
    reviews: 500,
    images: ['https://picsum.photos/seed/shami-hospital/800/600'],
    type: 'مشفى',
    description: 'اطمئن على صحتك مع برنامج الفحص الشامل في مشفى الشامي العريق. فحوصات مخبرية وشعاعية دقيقة تحت إشراف نخبة من الأطباء، مع إقامة فندقية فاخرة.',
    amenities: ['أحدث الأجهزة', 'فريق دولي', 'إقامة فاخرة'],
    features: ['نتائج سريعة'],
    isPopular: true,
    host: { name: 'إدارة المشفى', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=m5' }
  },

  // ================= DINING =================
  {
    id: 'd1',
    mainCategoryId: 'dining',
    subCategoryId: 'traditional',
    subSubCategoryId: 'restaurants',
    title: 'مطعم نارنج الدمشقي',
    location: 'دمشق، باب شرقي',
    price: 45,
    rating: 4.9,
    reviews: 1200,
    images: ['https://picsum.photos/seed/naranj-restaurant/800/600'],
    type: 'مطعم تراثي',
    description: 'تجربة عشاء فاخرة في قلب دمشق القديمة. يقدم مطعم نارنج أشهى المأكولات الشامية الأصيلة في أجواء تاريخية راقية مع خدمة متميزة.',
    amenities: ['جلسات خارجية', 'موسيقى حية', 'فاليه'],
    features: ['مناسب للمناسبات'],
    isPopular: true,
    host: { name: 'إدارة نارنج', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=d1' }
  },
  {
    id: 'd2',
    mainCategoryId: 'dining',
    subCategoryId: 'cafes',
    subSubCategoryId: 'traditional',
    title: 'كافيه الروضة - دمشق',
    location: 'شارع الروضة، دمشق',
    price: 15,
    rating: 4.7,
    reviews: 150,
    images: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80'],
    type: 'مقهى تراثي',
    description: 'من أعرق المقاهي في دمشق، ملتقى المثقفين والفنانين، يتميز بأجوائه الدمشقية الأصيلة.',
    amenities: ['جلسات تراثية', 'نرجيلة', 'مشروبات ساخنة'],
    features: ['جو ثقافي'],
    isPopular: false,
    host: { name: 'إدارة الروضة', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=d2' }
  },

  // ================= PHOTOGRAPHY =================
  {
    id: 'p1',
    mainCategoryId: 'photography',
    subCategoryId: 'events',
    subSubCategoryId: 'weddings',
    title: 'استوديو ذكريات للتصوير الاحترافي',
    location: 'حمص، شارع الحضارة',
    price: 200,
    rating: 4.8,
    reviews: 88,
    images: ['https://picsum.photos/seed/photography-studio/800/600'],
    type: 'استوديو تصوير',
    description: 'نوثق أجمل لحظاتكم بأحدث الكاميرات والتقنيات. متخصصون في تصوير الأعراس، المناسبات الخاصة، وجلسات التصوير الخارجية بلمسة فنية إبداعية.',
    amenities: ['تعديل صور احترافي', 'ألبوم مطبوع', 'تصوير فيديو 4K'],
    features: ['تسليم سريع'],
    isPopular: true,
    host: { name: 'المصور سامر', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=p1' }
  },
  {
    id: 'p2',
    mainCategoryId: 'photography',
    subCategoryId: 'events',
    subSubCategoryId: 'portrait',
    title: 'جلسة تصوير احترافية في قلعة حلب',
    location: 'حلب، سوريا',
    price: 60,
    rating: 4.8,
    reviews: 85,
    images: ['https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80'],
    type: 'جلسة تصوير',
    description: 'وثق لحظاتك المميزة في أعرق قلاع العالم مع مصورين محترفين متخصصين في تصوير البورتريه والمناظر الطبيعية.',
    amenities: ['تعديل صور احترافي', 'تسليم سريع', 'معدات حديثة'],
    features: ['موقع تاريخي'],
    isPopular: true,
    host: { name: 'المصور أحمد', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=p2' }
  },

  // ================= SHOPPING =================
  {
    id: 's1',
    mainCategoryId: 'shopping',
    subCategoryId: 'traditional',
    subSubCategoryId: 'souvenirs',
    title: 'متجر التحف الشرقية (الشرق)',
    location: 'دمشق، التكية السليمانية',
    price: 20,
    rating: 4.7,
    reviews: 45,
    images: ['https://picsum.photos/seed/souvenir-shop/800/600'],
    type: 'متجر هدايا',
    description: 'اقتنِ قطعة من روح دمشق. نوفر مجموعة واسعة من الصناعات اليدوية السورية، من الموزاييك والبروكار إلى النحاسيات والزجاج اليدوي الفاخر.',
    amenities: ['تغليف هدايا', 'شحن دولي', 'دفع إلكتروني'],
    features: ['صناعة يدوية أصيلة'],
    isPopular: false,
    host: { name: 'أبو خالد', isSuperhost: false, avatar: 'https://i.pravatar.cc/150?u=s1' }
  },
  {
    id: 's2',
    mainCategoryId: 'shopping',
    subCategoryId: 'malls',
    subSubCategoryId: 'fashion',
    title: 'تاون سنتر - تسوق عصري',
    location: 'أوتوستراد درعا، دمشق',
    price: 0,
    rating: 4.5,
    reviews: 450,
    images: ['https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=800&q=80'],
    type: 'مركز تجاري',
    description: 'أكبر مركز تجاري في دمشق يضم نخبة من الماركات العالمية والمحلية، بالإضافة إلى صالات ألعاب ومطاعم.',
    amenities: ['مواقف سيارات', 'منطقة ألعاب أطفال', 'تكييف مركزي'],
    features: ['ترفيه عائلي'],
    isPopular: false,
    host: { name: 'إدارة تاون سنتر', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=s2' }
  },

  // ================= TRANSPORT =================
  {
    id: 'tr1',
    mainCategoryId: 'transport',
    subCategoryId: 'rental',
    subSubCategoryId: 'cars',
    title: 'شركة الثقة لتأجير السيارات السياحية',
    location: 'دمشق، مطار دمشق الدولي',
    price: 60,
    rating: 4.6,
    reviews: 112,
    images: ['https://picsum.photos/seed/car-rental/800/600'],
    type: 'تأجير سيارات',
    description: 'أسطول حديث من السيارات السياحية بانتظارك. نوفر خدمة الاستلام والتسليم في المطار، مع تأمين شامل وخدمة المساعدة على الطريق على مدار الساعة.',
    amenities: ['تأمين شامل', 'كيلومترات مفتوحة', 'مقعد أطفال'],
    features: ['حجز فوري'],
    isPopular: true,
    host: { name: 'شركة الثقة', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=tr1' }
  },
  {
    id: 'tr2',
    mainCategoryId: 'transport',
    subCategoryId: 'shuttle',
    subSubCategoryId: 'airport',
    title: 'خدمة التوصيل من وإلى المطار',
    location: 'مطار دمشق الدولي',
    price: 25,
    rating: 4.8,
    reviews: 210,
    images: ['https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80'],
    type: 'توصيل مطار',
    description: 'خدمة توصيل VIP بسيارات فاخرة وسائقين محترفين لضمان راحتكم ووصولكم في الموعد المحدد.',
    amenities: ['سائق يتحدث الإنجليزية', 'سيارات مكيفة', 'مساعدة في الحقائب'],
    features: ['خدمة 24 ساعة'],
    isPopular: false,
    host: { name: 'خدمات المطار', isSuperhost: true, avatar: 'https://i.pravatar.cc/150?u=tr2' }
  }
];

// Get services by category
export function getServicesByCategory(categoryId: string): InitialService[] {
  return INITIAL_SERVICES.filter(s => s.mainCategoryId === categoryId);
}

// Get service by ID
export function getServiceById(id: string): InitialService | undefined {
  return INITIAL_SERVICES.find(s => s.id === id);
}

// Get popular services
export function getPopularServices(): InitialService[] {
  return INITIAL_SERVICES.filter(s => s.isPopular || s.rating >= 4.8);
}

// Get services by sub-category
export function getServicesBySubCategory(categoryId: string, subCategoryId: string): InitialService[] {
  return INITIAL_SERVICES.filter(s => 
    s.mainCategoryId === categoryId && s.subCategoryId === subCategoryId
  );
}

// Get all unique locations
export function getUniqueLocations(): string[] {
  return [...new Set(INITIAL_SERVICES.map(s => s.location))];
}

// Get services count by category
export function getServicesCountByCategory(categoryId: string): number {
  return INITIAL_SERVICES.filter(s => s.mainCategoryId === categoryId).length;
}
