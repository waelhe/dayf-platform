import { Metadata } from 'next';
import OrdersClient from './client';

export const metadata: Metadata = {
  title: 'طلباتي - ضيف',
};

export default function OrdersPage() {
  return <OrdersClient />;
}
