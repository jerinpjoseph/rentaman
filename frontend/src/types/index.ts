export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'WORKER' | 'ADMIN';
  avatar?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface WorkerProfile {
  id: string;
  userId: string;
  bio?: string;
  skills: string[];
  hourlyRate: number;
  experienceYears: number;
  isAvailable: boolean;
  city?: string;
  state?: string;
  avgRating: number;
  totalReviews: number;
  totalBookings: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface Booking {
  id: string;
  customerId: string;
  workerId?: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  address: string;
  city: string;
  totalAmount?: number;
  platformFeePercent?: number;
  platformFee?: number;
  netAmount?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentId?: string;
  razorpayOrderId?: string;
  notes?: string;
  cancellationReason?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  customer: Pick<User, 'id' | 'firstName' | 'lastName'>;
  worker?: Pick<User, 'id' | 'firstName' | 'lastName'>;
  category?: { id: string; name: string };
  review?: Review;
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface Conversation {
  id: string;
  bookingId?: string;
  lastMessageAt?: string;
  createdAt: string;
  otherParticipant: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalWorkers: number;
  totalBookings: number;
  completedBookings: number;
  pendingVerifications: number;
  totalRevenue: number;
  platformRevenue: number;
  workerPayouts: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
