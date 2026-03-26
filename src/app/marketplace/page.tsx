import { Metadata } from 'next';
import MarketplaceClient from './client';

export const metadata: Metadata = {
  title: 'السوق - ضيف',
  description: 'تسوق أفضل المنتجات السورية الأصيلة',
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
