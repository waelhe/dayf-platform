import { Metadata } from 'next';
import TopicDetailsClient from './client';

export const metadata: Metadata = {
  title: 'تفاصيل الموضوع - ضيف',
};

export default function TopicDetailsPage({ params }: { params: { topicId: string } }) {
  return <TopicDetailsClient topicId={params.topicId} />;
}
