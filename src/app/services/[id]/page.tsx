import { Metadata } from 'next';
import ServiceDetailsClient from './client';

export const metadata: Metadata = {
  title: 'تفاصيل الخدمة - ضيف',
};

export default function ServiceDetailsPage() {
  return <ServiceDetailsClient />;
}
