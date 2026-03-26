import { z } from 'zod';

// Service Schema for validation
export const ServiceSchema = z.object({
  id: z.string().optional(),
  mainCategoryId: z.string().min(1, "Main category is required"),
  subCategoryId: z.string().optional(),
  subSubCategoryId: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title is too long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(3, "Location is required"),
  price: z.number().positive("Price must be positive"),
  originalPrice: z.number().positive().optional(),
  rating: z.number().min(0).max(5),
  reviews: z.number().int().nonnegative(),
  views: z.number().int().nonnegative().default(0),
  images: z.array(z.string()).min(1, "At least one image is required"),
  type: z.string().min(1, "Type is required"),
  amenities: z.array(z.string()),
  features: z.array(z.string()),
  maxGuests: z.number().int().positive().default(4),
  bedrooms: z.number().int().positive().default(1),
  beds: z.number().int().positive().default(1),
  baths: z.number().int().positive().default(1),
  hostId: z.string().optional(),
  hostName: z.string().optional(),
  hostAvatar: z.string().optional(),
  isSuperhost: z.boolean().default(false),
  isPopular: z.boolean().default(false),
});

// Service type inferred from schema
export type Service = z.infer<typeof ServiceSchema>;

// Service from database (with JSON strings parsed)
export interface ServiceFromDB {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  originalPrice: number | null;
  rating: number;
  reviews: number;
  views: number;
  images: string; // JSON string in DB
  type: string;
  amenities: string; // JSON string in DB
  features: string; // JSON string in DB
  mainCategoryId: string;
  subCategoryId: string | null;
  subSubCategoryId: string | null;
  hostId: string | null;
  hostName: string | null;
  hostAvatar: string | null;
  isSuperhost: boolean;
  isPopular: boolean;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  createdAt: Date;
  updatedAt: Date;
}

// Host information
export interface ServiceHost {
  name: string;
  isSuperhost: boolean;
  avatar: string;
}

// Main category structure
export interface SubSubCategory {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
  icon?: string;
  subCategories?: SubSubCategory[];
}

export interface MainCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  image: string;
  subCategories: SubCategory[];
}

// Service section props
export interface ServiceSectionProps {
  title: string;
  subtitle?: string;
  categoryId?: string;
  subCategoryId?: string;
  filterPopular?: boolean;
  limit?: number;
  viewAllPath?: string;
}

// Service card props
export interface ServiceCardProps {
  service: Service;
  activeColorClass?: string;
  activeTextClass?: string;
  activeBgLightClass?: string;
  className?: string;
}

// Service form props
export interface ServiceFormProps {
  initialData?: Partial<Service>;
  onSubmit: (data: Service) => Promise<void>;
  isLoading?: boolean;
}

// Add service modal props
export interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  service?: Service | null;
}
