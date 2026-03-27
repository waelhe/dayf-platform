import { Metadata } from 'next';
import BookingsClient from './client';

export const metadata: Metadata = {
  title: 'حجوزاتي - ضيف',
};

export default function BookingsPage() {
  return <BookingsClient />;
}
