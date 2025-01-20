export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface RestaurantOwner {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthState {
  user: {
    data: User | null;
    tokens: AuthTokens | null;
  };
  owner: {
    data: RestaurantOwner | null;
    tokens: AuthTokens | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}
