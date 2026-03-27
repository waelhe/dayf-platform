// Community Types - Adapted for Prisma

export interface CommunityTopic {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  categoryId: string;
  subCategoryId?: string;
  createdAt: Date;
  updatedAt?: Date;
  likesCount: number;
  repliesCount: number;
  isOfficial: boolean;
}

export interface Reply {
  id: string;
  topicId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  likesCount: number;
}

export interface MemberProfile {
  id: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  reputationPoints: number;
  createdAt: Date;
  topicsCount: number;
  repliesCount: number;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface TravelGuide {
  id: string;
  title: string;
  description: string;
  content?: string;
  image: string;
  readTime: string;
  author: string;
  date?: string;
  tags: string[];
}
