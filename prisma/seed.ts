/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Prisma Seed Script
 *
 * بيانات تجريبية لمنصة ضيف - السياحة السورية
 */

import { PrismaClient, Role, BookingStatus, OrderStatus, ReviewType, ReviewStatus, ReviewerLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 بدء زرع البيانات التجريبية...\n');

  // ============================================
  // 1. USERS - المستخدمين
  // ============================================
  console.log('👤 إنشاء المستخدمين...');

  const users = await Promise.all([
    // Demo User - المستخدم التجريبي
    prisma.user.upsert({
      where: { id: 'demo-user' },
      update: {},
      create: {
        id: 'demo-user',
        email: 'demo@dayf.sy',
        displayName: 'مستخدم تجريبي',
        avatar: null,
        role: 'USER',
        language: 'ar',
        loyaltyPoints: 150,
      },
    }),
    // Admin
    prisma.user.upsert({
      where: { id: 'admin-1' },
      update: {},
      create: {
        id: 'admin-1',
        email: 'admin@dayf.sy',
        displayName: 'مدير المنصة',
        avatar: null,
        role: 'ADMIN',
        language: 'ar',
        loyaltyPoints: 1000,
      },
    }),
    // Hosts/Providers
    prisma.user.upsert({
      where: { id: 'host-1' },
      update: {},
      create: {
        id: 'host-1',
        email: 'ahmad.host@dayf.sy',
        displayName: 'أحمد الشمّاس',
        avatar: null,
        role: 'HOST',
        language: 'ar',
        loyaltyPoints: 450,
      },
    }),
    prisma.user.upsert({
      where: { id: 'host-2' },
      update: {},
      create: {
        id: 'host-2',
        email: 'sara.host@dayf.sy',
        displayName: 'سارة الأيوبي',
        avatar: null,
        role: 'HOST',
        language: 'ar',
        loyaltyPoints: 320,
      },
    }),
    prisma.user.upsert({
      where: { id: 'host-3' },
      update: {},
      create: {
        id: 'host-3',
        email: 'mazen.host@dayf.sy',
        displayName: 'مازن العظمة',
        avatar: null,
        role: 'HOST',
        language: 'ar',
        loyaltyPoints: 280,
      },
    }),
    // Vendors - بائعين السوق
    prisma.user.upsert({
      where: { id: 'vendor-1' },
      update: {},
      create: {
        id: 'vendor-1',
        email: 'vendor.souk@dayf.sy',
        displayName: 'حرفة دمشق',
        avatar: null,
        role: 'USER',
        language: 'ar',
        loyaltyPoints: 200,
      },
    }),
    prisma.user.upsert({
      where: { id: 'vendor-2' },
      update: {},
      create: {
        id: 'vendor-2',
        email: 'vendor.aleppo@dayf.sy',
        displayName: 'صناعة حلب',
        avatar: null,
        role: 'USER',
        language: 'ar',
        loyaltyPoints: 180,
      },
    }),
    // Regular Users
    prisma.user.upsert({
      where: { id: 'user-1' },
      update: {},
      create: {
        id: 'user-1',
        email: 'fatima@dayf.sy',
        displayName: 'فاطمة الزهراء',
        avatar: null,
        role: 'USER',
        language: 'ar',
        loyaltyPoints: 75,
      },
    }),
    prisma.user.upsert({
      where: { id: 'user-2' },
      update: {},
      create: {
        id: 'user-2',
        email: 'omar@dayf.sy',
        displayName: 'عmar الخالد',
        avatar: null,
        role: 'USER',
        language: 'ar',
        loyaltyPoints: 120,
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${users.length} مستخدم\n`);

  // ============================================
  // 2. PRODUCTS - منتجات السوق
  // ============================================
  console.log('🛍️ إنشاء المنتجات...');

  const products = await Promise.all([
    // منتجات يدوية
    prisma.product.create({
      data: {
        name: 'صابون حلبي عتيق',
        description: 'صابون حلبي أصلي مصنوع من زيت الزيتون والغار الطبيعي. يتميز بخصائصه المغذية للبشرة ورائحته العطرة الفريدة. منتج تقليدي يُصنع يدوياً في حلب منذ قرون.',
        price: 15.99,
        category: 'handicrafts',
        location: 'حلب',
        rating: 4.9,
        reviews: 128,
        image: '/cities/aleppo.png',
        vendorId: 'vendor-2',
      },
    }),
    prisma.product.create({
      data: {
        name: 'زيت زيتون معصور على البارد',
        description: 'زيت زيتون سوري أصلي من معاصر ريف دمشق. عُصر على البارد للحفاظ على جميع فوائده الغذائية. درجة حموضة أقل من 0.5%',
        price: 25.00,
        category: 'food',
        location: 'ريف دمشق',
        rating: 4.8,
        reviews: 95,
        image: '/cities/damascus.png',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'بروش دمشقي مطرز',
        description: 'بروش تقليدي مطرز يدوياً بخيوط الحرير. زخارف هندسية أصيلة مستوحاة من التراث الدمشقي. قطعة فنية تُزين أي صالة.',
        price: 150.00,
        category: 'textiles',
        location: 'دمشق - المدينة القديمة',
        rating: 4.7,
        reviews: 42,
        image: '/cities/damascus-hero.jpg',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'بهارات شامية مشكلة',
        description: 'خلطة بهارات شامية أصلية للطبخ التقليدي. تتضمن: فلفل أسود، قرفة، كبابة صيني، بهار حلو، جوزة الطيب. تُضفي نكهة مميزة على أطباقك.',
        price: 12.50,
        category: 'spices',
        location: 'دمشق - سوق الحميدية',
        rating: 4.6,
        reviews: 78,
        image: '/cities/damascus.png',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'فخاريات مأثورة يدوية',
        description: 'أطباق فخارية مصنوعة يدوياً في ورش دمشق التقليدية. مناسبة للتقديم والزينة. كل قطعة فريدة في تفاصيلها.',
        price: 45.00,
        category: 'handicrafts',
        location: 'دمشق',
        rating: 4.5,
        reviews: 34,
        image: '/cities/damascus.png',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'عسل سوري طبيعي',
        description: 'عسل طبيعي من خلايا جبل قاسيون. عسل صافٍ غير معالج يحتفظ بجميع خصائصه العلاجية. غني بالفيتامينات والمعادن.',
        price: 35.00,
        category: 'food',
        location: 'ريف دمشق - قاسيون',
        rating: 4.9,
        reviews: 156,
        image: '/cities/damascus-hero.jpg',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'ماء ورد دمشقي',
        description: 'ماء ورد طبيعي مقطر من ورود دمشق. يُستخدم في الحلويات الشامية والعناية بالبشرة. رائحة فواحة تعيشق.',
        price: 8.99,
        category: 'food',
        location: 'دمشق - الغوطة',
        rating: 4.8,
        reviews: 89,
        image: '/cities/damascus.png',
        vendorId: 'vendor-1',
      },
    }),
    prisma.product.create({
      data: {
        name: 'حلويات تركية بالفستق',
        description: 'بقلاوة تركية طازجة محشوة بالفستق الحلبي. تُحضّر يدوياً يومياً. طعم لا يُقاوم!',
        price: 28.00,
        category: 'food',
        location: 'دمشق',
        rating: 4.7,
        reviews: 112,
        image: '/cities/aleppo.png',
        vendorId: 'vendor-1',
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${products.length} منتج\n`);

  // ============================================
  // 3. SERVICES - الخدمات السياحية
  // ============================================
  console.log('🏨 إنشاء الخدمات السياحية...');

  const services = await Promise.all([
    // إقامات
    prisma.service.create({
      data: {
        title: 'بيت دمشقي تقليدي - المدينة القديمة',
        description: 'بيت دمشقي عتيق مُجدد في قلب المدينة القديمة. يتميز بفناء داخلي ونافورة وأشجار الياسمين. تجربة إقامة أصيلة تجمع بين التراث والراحة الحديثة.',
        location: 'دمشق - المدينة القديمة',
        price: 85.00,
        rating: 4.9,
        reviews: 67,
        images: JSON.stringify(['/cities/damascus.png', '/cities/damascus-hero.jpg']),
        type: 'accommodation',
        amenities: JSON.stringify(['واي فاي', 'إفطار تقليدي', 'تدفئة', 'حمام خاص']),
        features: JSON.stringify(['فناء داخلي', 'نافورة', 'تراس', 'مطبخ مجهز']),
        mainCategoryId: 'stay',
        hostId: 'host-1',
        maxGuests: 6,
        bedrooms: 3,
        beds: 5,
        baths: 2,
      },
    }),
    prisma.service.create({
      data: {
        title: 'شقة فندقية - الكورنيش البحري',
        description: 'شقة فندقية فاخرة بإطلالة بحرية على كورنيش اللاذقية. مثالية للعائلات. قريبة من الشاطئ والمطاعم والأسواق.',
        location: 'اللاذقية - الكورنيش الجنوبي',
        price: 65.00,
        rating: 4.7,
        reviews: 45,
        images: JSON.stringify(['/cities/latakia.png']),
        type: 'accommodation',
        amenities: JSON.stringify(['واي فاي', 'مكيّف', 'مطبخ مجهز', 'شرفة']),
        features: JSON.stringify(['إطلالة بحرية', 'مصعد', 'موقف سيارات']),
        mainCategoryId: 'stay',
        hostId: 'host-2',
        maxGuests: 4,
        bedrooms: 2,
        beds: 3,
        baths: 1,
      },
    }),
    prisma.service.create({
      data: {
        title: 'غرفة في قلعة حلب',
        description: 'تجربة نوم فريدة داخل أسوار قلعة حلب التاريخية. غرف مُجددة تحافظ على الطابع التاريخي مع وسائل الراحة الحديثة.',
        location: 'حلب - القلعة',
        price: 95.00,
        rating: 4.8,
        reviews: 23,
        images: JSON.stringify(['/cities/aleppo.png', '/cities/aleppo.jpg']),
        type: 'accommodation',
        amenities: JSON.stringify(['واي فاي', 'إفطار', 'تدفئة مركزية']),
        features: JSON.stringify(['إطلالة على القلعة', 'جولات مرشدة', 'عشاء تقليدي']),
        mainCategoryId: 'stay',
        hostId: 'host-3',
        maxGuests: 2,
        bedrooms: 1,
        beds: 1,
        baths: 1,
      },
    }),
    // جولات سياحية
    prisma.service.create({
      data: {
        title: 'جولة في أسواق دمشق القديمة',
        description: 'جولة مرشدة في أسواق دمشق التاريخية: سوق الحميدية، سوق البزورية، خان أسعد باشا. استمتع بتجربة التسوق التقليدي وتذوق المأكولات الشامية.',
        location: 'دمشق - الأسواق القديمة',
        price: 25.00,
        rating: 4.9,
        reviews: 89,
        images: JSON.stringify(['/cities/damascus.png']),
        type: 'tour',
        amenities: JSON.stringify(['مرشد سياحي', 'نقل', 'وجبة خفيفة']),
        features: JSON.stringify(['مرونة في المواعيد', 'جماعات صغيرة', 'صور تذكارية']),
        mainCategoryId: 'experience',
        hostId: 'host-1',
        maxGuests: 8,
        bedrooms: 0,
        beds: 0,
        baths: 0,
      },
    }),
    prisma.service.create({
      data: {
        title: 'رحلة إلى تدمر - مدينة الصحراء',
        description: 'رحلة ليوم كامل إلى مدينة تدمر الأثرية. زيارة معبد بل، المدرج الروماني، وواحة تدمر. تذوق الغداء البدوي التقليدي.',
        location: 'تدمر',
        price: 55.00,
        rating: 4.8,
        reviews: 56,
        images: JSON.stringify(['/cities/palmyra.png']),
        type: 'tour',
        amenities: JSON.stringify(['نقل مكيف', 'مرشد', 'غداء تقليدي', 'مياه']),
        features: JSON.stringify(['انطلاق من دمشق', 'جولة مصورة', 'وقت حر للاستكشاف']),
        mainCategoryId: 'experience',
        hostId: 'host-1',
        maxGuests: 12,
        bedrooms: 0,
        beds: 0,
        baths: 0,
      },
    }),
    // مطاعم
    prisma.service.create({
      data: {
        title: 'عشاء شامي تقليدي - بيت أبو خالد',
        description: 'تجربة عشاء أصيلة في بيت دمشقي تقليدي. قائمة محددة تتغير حسب الموسم. مشاوي، مازات، حلويات شامية منزلية.',
        location: 'دمشق - المزرعة',
        price: 35.00,
        rating: 4.9,
        reviews: 134,
        images: JSON.stringify(['/cities/damascus-hero.jpg']),
        type: 'restaurant',
        amenities: JSON.stringify(['جلسات عائلية', 'أطباق نباتية', 'حلويات منزلية']),
        features: JSON.stringify(['حجز مسبق', 'قائمة موسمية', 'أجواء تقليدية']),
        mainCategoryId: 'food',
        hostId: 'host-2',
        maxGuests: 20,
        bedrooms: 0,
        beds: 0,
        baths: 0,
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${services.length} خدمة سياحية\n`);

  // ============================================
  // 4. TOPICS - مواضيع المجتمع
  // ============================================
  console.log('💬 إنشاء مواضيع المجتمع...');

  const topics = await Promise.all([
    prisma.topic.create({
      data: {
        title: 'أفضل الأماكن السياحية في دمشق القديمة',
        content: `مرحباً للجميع! 🌟

أريد أن أشارككم تجربتي في زيارة دمشق القديمة، وأسأل عن أفضل الأماكن التي يمكن زيارتها.

زرت مؤخراً:
- الجامع الأموي
- سوق الحميدية
- باب توما
- حي القيمرية

لكنني أريد استكشاف المزيد من الأماكن الخفية والتاريخية. هل لديكم أي اقتراحات؟

شكراً مقدماً! 🙏`,
        authorId: 'demo-user',
        categoryId: 'travel',
        likesCount: 45,
        repliesCount: 12,
        isOfficial: false,
      },
    }),
    prisma.topic.create({
      data: {
        title: 'نصائح للسفر إلى سوريا - دليل شامل',
        content: `السلام عليكم،

حبيت أشارككم بعض النصائح المهمة للسفر إلى سوريا:

📋 **الأوراق المطلوبة:**
- جواز سفر ساري
- تأشيرة دخول (يمكن الحصول عليها من السفارة)
- حجز الفندق

💰 **الميزانية:**
- الإقامة: 30-100$ لليلة
- الطعام: 10-30$ يومياً
- النقل: 5-15$ يومياً

🏨 **أفضل المناطق للإقامة:**
- دمشق: المدينة القديمة، المزرعة
- حلب: حول القلعة
- اللاذقية: الكورنيش

أتمنى يكون الدليل مفيد! 😊`,
        authorId: 'host-1',
        categoryId: 'tips',
        likesCount: 89,
        repliesCount: 23,
        isOfficial: true,
      },
    }),
    prisma.topic.create({
      data: {
        title: 'أفضل المطاعم الشامية التقليدية',
        content: `أهلاً بالجميع،

دعونا نجمع قائمة بأفضل المطاعم التي تقدم المأكولات الشامية الأصيلة:

1. **بيت الشام** - دمشق القديمة
   - التخصص: مشاوي ومازات
   - السعر: متوسط

2. **مطعم الأموي** - باب توما
   - التخصص: مأكولات شامية تراثية
   - السعر: فاخر

3. **أبو كمال** - المزة
   - التخصص: فطائر وشاورما
   - السعر: اقتصادي

هل لديكم تجارب أخرى؟ شاركونا! 🍽️`,
        authorId: 'user-1',
        categoryId: 'food',
        likesCount: 56,
        repliesCount: 18,
        isOfficial: false,
      },
    }),
    prisma.topic.create({
      data: {
        title: 'تجربتي في سوق الحميدية - نصائح للتسوق',
        content: `السلام عليكم،

زرت سوق الحميدية الشهير في دمشق وهذه تجربتي ونصائحي:

🛍️ **ماذا تشتري:**
- البروك الدمشقي
- الصابون الحلبي
- البهارات والتوابل
- الحلويات الشامية
- التحف والمصنوعات اليدوية

💡 **نصائح:**
- المساومة متوقعة ومقبولة
- احمل نقداً (العملة الصعبة مقبولة)
- ابدأ من الساعة 10 صباحاً
- جرب البوظة الدمشقية!

📸 **أفضل أماكن التصوير:**
- المدخل الرئيسي
- محلات البروك
- مقهى النوفرة

سوق رائع يستحق الزيارة! ❤️`,
        authorId: 'user-2',
        categoryId: 'tips',
        likesCount: 72,
        repliesCount: 15,
        isOfficial: false,
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${topics.length} موضوع\n`);

  // ============================================
  // 5. REPLIES - الردود
  // ============================================
  console.log('💬 إنشاء الردود...');

  const replies = await Promise.all([
    // ردود على الموضوع الأول
    prisma.reply.create({
      data: {
        topicId: topics[0].id,
        content: 'أنصحك بزيارة بيت النعمان، مكان رائع جداً وله تاريخ عريق. أيضاً لا تفوت زيارة خان أسعد باشا العظم.',
        authorId: 'host-1',
        likesCount: 23,
      },
    }),
    prisma.reply.create({
      data: {
        topicId: topics[0].id,
        content: 'إذا كنت مهتماً بالفنون، زر متحف دمشق الوطني. كما أن هناك مقاهي تراثية جميلة في حي الشاغور.',
        authorId: 'user-1',
        likesCount: 15,
      },
    }),
    prisma.reply.create({
      data: {
        topicId: topics[0].id,
        content: 'حي القيمرية في الليل ساحر! المقاهي والمطاعم هناك تقدم أجواء لا تُنسى. جرب مقهى النوفرة.',
        authorId: 'host-2',
        likesCount: 18,
      },
    }),
    // ردود على الموضوع الثاني
    prisma.reply.create({
      data: {
        topicId: topics[1].id,
        content: 'شكراً على الدليل الشامل! أضيف أن أفضل وقت للزيارة هو الربيع (مارس-مايو) والخريف (سبتمبر-نوفمبر).',
        authorId: 'demo-user',
        likesCount: 34,
      },
    }),
    prisma.reply.create({
      data: {
        topicId: topics[1].id,
        content: 'نصيحة إضافية: حمّل خرائط Google للعمل offline لأن الإنترنت قد يكون ضعيفاً في بعض المناطق.',
        authorId: 'user-2',
        likesCount: 28,
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${replies.length} رد\n`);

  // ============================================
  // 6. BOOKINGS - الحجوزات
  // ============================================
  console.log('📅 إنشاء الحجوزات...');

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekPlus3 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const nextMonthPlus5 = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  const bookings = await Promise.all([
    // حجز قادم
    prisma.booking.create({
      data: {
        guestId: 'demo-user',
        hostId: 'host-1',
        serviceId: services[0].id,
        checkIn: nextWeek,
        checkOut: nextWeekPlus3,
        guests: 2,
        totalPrice: 255.00,
        status: 'CONFIRMED',
      },
    }),
    // حزر قادم آخر
    prisma.booking.create({
      data: {
        guestId: 'demo-user',
        hostId: 'host-2',
        serviceId: services[1].id,
        checkIn: nextMonth,
        checkOut: nextMonthPlus5,
        guests: 4,
        totalPrice: 325.00,
        status: 'PENDING',
      },
    }),
    // حجز مكتمل
    prisma.booking.create({
      data: {
        guestId: 'user-1',
        hostId: 'host-1',
        serviceId: services[0].id,
        checkIn: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        checkOut: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        guests: 3,
        totalPrice: 340.00,
        status: 'COMPLETED',
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${bookings.length} حجز\n`);

  // ============================================
  // 7. ORDERS - الطلبات
  // ============================================
  console.log('📦 إنشاء الطلبات...');

  const orders = await Promise.all([
    // طلب قيد التجهيز
    prisma.order.create({
      data: {
        userId: 'demo-user',
        total: 53.98,
        status: 'PROCESSING',
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: 2,
              price: 15.99,
            },
            {
              productId: products[3].id,
              quantity: 1,
              price: 12.50,
            },
            {
              productId: products[6].id,
              quantity: 1,
              price: 8.99,
            },
          ],
        },
      },
    }),
    // طلب تم تسليمه
    prisma.order.create({
      data: {
        userId: 'demo-user',
        total: 35.00,
        status: 'DELIVERED',
        items: {
          create: [
            {
              productId: products[5].id,
              quantity: 1,
              price: 35.00,
            },
          ],
        },
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${orders.length} طلب\n`);

  // ============================================
  // 8. CART - سلة التسوق
  // ============================================
  console.log('🛒 إنشاء سلة التسوق...');

  const cart = await prisma.cart.create({
    data: {
      userId: 'demo-user',
      items: {
        create: [
          {
            productId: products[1].id,
            quantity: 1,
          },
          {
            productId: products[4].id,
            quantity: 2,
          },
        ],
      },
    },
  });

  console.log(`   ✅ تم إنشاء السلة مع 2 منتج\n`);

  // ============================================
  // 9. REVIEWS - المراجعات
  // ============================================
  console.log('⭐ إنشاء المراجعات...');

  // إنشاء ملفات المراجعين
  const reviewerProfiles = await Promise.all([
    prisma.reviewerProfile.create({
      data: {
        userId: 'demo-user',
        level: ReviewerLevel.ACTIVE_REVIEWER,
        badges: JSON.stringify(['PHOTO_CONTRIBUTOR']),
        totalReviews: 5,
        totalHelpful: 23,
        totalPhotos: 8,
        citiesVisited: JSON.stringify(['دمشق', 'حلب', 'اللاذقية']),
      },
    }),
    prisma.reviewerProfile.create({
      data: {
        userId: 'user-1',
        level: ReviewerLevel.NEW_REVIEWER,
        totalReviews: 2,
        totalHelpful: 5,
        totalPhotos: 0,
        citiesVisited: JSON.stringify(['دمشق']),
      },
    }),
    prisma.reviewerProfile.create({
      data: {
        userId: 'user-2',
        level: ReviewerLevel.ACTIVE_REVIEWER,
        badges: JSON.stringify(['HELPFUL_REVIEWER']),
        totalReviews: 7,
        totalHelpful: 32,
        totalPhotos: 3,
        citiesVisited: JSON.stringify(['دمشق', 'حلب', 'تدمر']),
      },
    }),
  ]);

  // إنشاء المراجعات
  const reviews = await Promise.all([
    // مراجعة على الخدمة الأولى
    prisma.review.create({
      data: {
        type: ReviewType.SERVICE,
        referenceId: services[0].id,
        bookingId: bookings[2].id, // الحجز المكتمل
        authorId: 'user-1',
        title: 'تجربة لا تُنسى في بيت دمشقي أصيل',
        content: 'قضيت 4 ليالٍ في هذا البيت الدمشقي الرائع. المكان نظيف جداً والمضيفون ودودون ومتعاونون. الفناء الداخلي مع النافورة والأشجار يعطي أجواءً ساحرة. الإفطار التقليدي كان لذيذاً ومتنوعاً. الموقع ممتاز في قلب المدينة القديمة، قريب من كل المعالم. أنصح الجميع بهذه التجربة الفريدة!',
        rating: 4.8,
        cleanliness: 5,
        location: 5,
        value: 4,
        serviceRating: 5,
        amenities: 5,
        communication: 5,
        isVerified: true,
        helpfulCount: 12,
        visitDate: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
      },
    }),
    // مراجعة على الخدمة الأولى (أخرى)
    prisma.review.create({
      data: {
        type: ReviewType.SERVICE,
        referenceId: services[0].id,
        authorId: 'user-2',
        title: 'بيت جميل مع بعض الملاحظات',
        content: 'البيت جميل والموقع رائع. الإفطار لذيذ. لكن كانت هناك مشكلة في التدفئة ليلاً.总体 تجربة جيدة ولكن يمكن تحسين بعض الأمور. المضيف متعاون ومتجاوب.',
        rating: 4.0,
        cleanliness: 4,
        location: 5,
        value: 4,
        serviceRating: 4,
        amenities: 3,
        communication: 5,
        isVerified: false,
        helpfulCount: 5,
      },
    }),
    // مراجعة على الخدمة الرابعة (جولة)
    prisma.review.create({
      data: {
        type: ReviewType.SERVICE,
        referenceId: services[3].id,
        authorId: 'demo-user',
        title: 'جولة رائعة في أسواق دمشق',
        content: 'جولة ممتعة ومفيدة! المرشد كان على دراية كبيرة بتاريخ المنطقة. تعلمنا الكثير عن تاريخ دمشق وأسواقها. جربنا أطعمة تقليدية لذيذة. أنصح بهذه الجولة لكل من يريد استكشاف دمشق الحقيقية!',
        rating: 4.9,
        cleanliness: 5,
        location: 5,
        value: 5,
        serviceRating: 5,
        amenities: 4,
        communication: 5,
        isVerified: false,
        helpfulCount: 18,
      },
    }),
    // مراجعة على الخدمة الخامسة (تدمر)
    prisma.review.create({
      data: {
        type: ReviewType.SERVICE,
        referenceId: services[4].id,
        authorId: 'user-2',
        title: 'رحلة تدمر - يوم لا يُنسى',
        content: 'رحلة منظمة بشكل ممتاز! السائق كان محترفاً والسيارة مريحة. المرشد قدم شرحاً وافياً عن تاريخ تدمر. الغداء البدوي كان تجربة فريدة. أنصح بهذه الرحلة بشدة!',
        rating: 5.0,
        cleanliness: 5,
        location: 5,
        value: 5,
        serviceRating: 5,
        amenities: 5,
        communication: 5,
        isVerified: false,
        helpfulCount: 15,
      },
    }),
    // مراجعة على المنتج الأول
    prisma.review.create({
      data: {
        type: ReviewType.PRODUCT,
        referenceId: products[0].id,
        authorId: 'demo-user',
        title: 'صابون حلبي أصلي وممتاز',
        content: 'صابون حلبي حقيقي بنوعيته العالية. الرائحة طبيعية والملمس ناعم. استخدمته للبشرة والشعر والنتائج رائعة. التغليف كان أنيقاً والشحن سريع.',
        rating: 4.9,
        value: 5,
        serviceRating: 5,
        isVerified: false,
        helpfulCount: 8,
      },
    }),
  ]);

  // إنشاء صور للمراجعات
  const reviewPhotos = await Promise.all([
    prisma.reviewPhoto.create({
      data: {
        reviewId: reviews[0].id,
        url: '/reviews/damascus-house-1.jpg',
        caption: 'الفناء الداخلي',
        order: 0,
      },
    }),
    prisma.reviewPhoto.create({
      data: {
        reviewId: reviews[0].id,
        url: '/reviews/damascus-house-2.jpg',
        caption: 'غرفة الضيوف',
        order: 1,
      },
    }),
    prisma.reviewPhoto.create({
      data: {
        reviewId: reviews[2].id,
        url: '/reviews/souks-tour.jpg',
        caption: 'سوق الحميدية',
        order: 0,
      },
    }),
  ]);

  // إنشاء ردود على المراجعات
  const reviewReplies = await Promise.all([
    prisma.reviewReply.create({
      data: {
        reviewId: reviews[0].id,
        authorId: 'host-1',
        authorName: 'أحمد الشمّاس',
        authorRole: 'PROVIDER',
        content: 'شكراً جزيلاً على مراجعتك الرائعة! سعداء جداً بأن تجربتك كانت مميزة. نتطلع لاستضافتك مرة أخرى في المستقبل. أهلاً وسهلاً بك دائماً!',
      },
    }),
    prisma.reviewReply.create({
      data: {
        reviewId: reviews[1].id,
        authorId: 'host-1',
        authorName: 'أحمد الشمّاس',
        authorRole: 'PROVIDER',
        content: 'شكراً على ملاحظاتك القيمة. نعتذر عن مشكلة التدفئة وقد تم إصلاحها. نتمنى أن نستضيفك مجدداً لتجربة أفضل!',
      },
    }),
  ]);

  console.log(`   ✅ تم إنشاء ${reviews.length} مراجعة`);
  console.log(`   ✅ تم إنشاء ${reviewPhotos.length} صورة مراجعة`);
  console.log(`   ✅ تم إنشاء ${reviewReplies.length} رد على مراجعات\n`);

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════');
  console.log('🎉 تمت زراعة البيانات بنجاح!');
  console.log('═══════════════════════════════════════');
  console.log(`👤 المستخدمين: ${users.length}`);
  console.log(`🛍️ المنتجات: ${products.length}`);
  console.log(`🏨 الخدمات: ${services.length}`);
  console.log(`💬 المواضيع: ${topics.length}`);
  console.log(`📝 الردود: ${replies.length}`);
  console.log(`📅 الحجوزات: ${bookings.length}`);
  console.log(`📦 الطلبات: ${orders.length}`);
  console.log(`⭐ المراجعات: ${reviews.length}`);
  console.log(`📸 صور المراجعات: ${reviewPhotos.length}`);
  console.log(`💬 ردود المراجعات: ${reviewReplies.length}`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في زراعة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
