import { Metadata } from 'next';
import ServicesPageClient from './client';

export const metadata: Metadata = {
  title: 'الخدمات - ضيف',
  description: 'استكشف أفضل الخدمات السياحية والعقارية والطبية في سوريا',
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
