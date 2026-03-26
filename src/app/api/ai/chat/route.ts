import { NextRequest, NextResponse } from 'next/server';

// AI Chat endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, language = 'ar' } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Simulate AI response based on keywords
    const lowerMessage = message.toLowerCase();
    let response: string;
    
    if (lowerMessage.includes('فندق') || lowerMessage.includes('hotel') || lowerMessage.includes('اقامة') || lowerMessage.includes('accommodation')) {
      response = language === 'ar' 
        ? 'يوجد لدينا العديد من الفنادق والشقق الفندقية الرائعة في دمشق وحلب واللاذقية. هل تريد مساعدة في العثور على مكان مناسب؟'
        : 'We have many great hotels and apartments in Damascus, Aleppo, and Latakia. Would you like help finding a suitable place?';
    } else if (lowerMessage.includes('مطعم') || lowerMessage.includes('restaurant') || lowerMessage.includes('اكل') || lowerMessage.includes('food')) {
      response = language === 'ar'
        ? 'المطبخ السوري من أشهر المطابخ في العالم! يمكنني اقتراح أفضل المطاعم في المدينة التي تخطط لزيارتها.'
        : 'Syrian cuisine is one of the most famous in the world! I can suggest the best restaurants in the city you plan to visit.';
    } else if (lowerMessage.includes('سياح') || lowerMessage.includes('tour') || lowerMessage.includes('زيارة') || lowerMessage.includes('visit')) {
      response = language === 'ar'
        ? 'سوريا غنية بالمواقع الأثرية والسياحية: تدمر، قلعة حلب، الجامع الأموي، سوق الحميدية، وغيرها الكثير. أي مدينة تود زيارتها؟'
        : 'Syria is rich in archaeological and tourist sites: Palmyra, Aleppo Citadel, the Umayyad Mosque, Souq Al-Hamidiyya, and many more. Which city would you like to visit?';
    } else if (lowerMessage.includes('سعر') || lowerMessage.includes('price') || lowerMessage.includes('كم')) {
      response = language === 'ar'
        ? 'الأسعار تختلف حسب نوع الخدمة والموقع. يمكنني مساعدتك في العثور على أفضل الخيارات المناسبة لميزانيتك.'
        : 'Prices vary depending on the type of service and location. I can help you find the best options for your budget.';
    } else if (lowerMessage.includes('شكر') || lowerMessage.includes('thank')) {
      response = language === 'ar'
        ? 'العفو! سعيد بخدمتك. هل هناك شيء آخر يمكنني مساعدتك به؟'
        : 'You\'re welcome! Happy to help. Is there anything else I can assist you with?';
    } else {
      response = language === 'ar' 
        ? `شكراً لرسالتك! أنا مساعد ضيف وأستطيع مساعدتك في:
• البحث عن أماكن الإقامة والفنادق
• ترتيب جولات سياحية
• تقديم معلومات عن المطاعم والفنادق
• المساعدة في الحجوزات

كيف يمكنني مساعدتك اليوم؟`
        : `Thank you for your message! I'm Dheif assistant and I can help you with:
• Finding accommodations and hotels
• Arranging tours
• Information about restaurants and hotels
• Booking assistance

How can I help you today?`;
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
