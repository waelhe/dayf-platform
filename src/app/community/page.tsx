import { Metadata } from 'next';
import CommunityClient from './client';

export const metadata: Metadata = {
  title: 'المجتمع - ضيف',
  description: 'انضم إلى مجتمع ضيف وتواصل مع المسافرين الآخرين',
};

export default function CommunityPage() {
  return <CommunityClient />;
}
