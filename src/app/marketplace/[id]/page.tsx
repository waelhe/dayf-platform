import { Metadata } from 'next';
import ProductDetailsClient from './client';

export const metadata: Metadata = {
  title: 'تفاصيل المنتج - ضيف',
};

export default async function ProductDetailsPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  return <ProductDetailsClient productId={id} />;
}
