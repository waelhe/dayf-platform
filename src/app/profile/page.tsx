import { Metadata } from 'next';
import { Profile } from '@/features/user';

export const metadata: Metadata = {
  title: 'الملف الشخصي - ضيف',
};

export default function ProfilePage() {
  return <Profile userId="guest" language="ar" />;
}
