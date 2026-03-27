import { Metadata } from 'next';
import CartClient from './client';

export const metadata: Metadata = {
  title: 'السلة - ضيف',
};

export default function CartPage() {
  return <CartClient />;
}
