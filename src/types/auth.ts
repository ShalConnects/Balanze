export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  subscription: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    validUntil: string;
  };
  profilePicture?: string; // Optional profile picture URL
  local_currency?: string;
  selected_currencies?: string[];
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName: string;
} 

