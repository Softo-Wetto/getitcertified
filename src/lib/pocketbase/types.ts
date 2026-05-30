export type RawPocketBaseRecord = Record<string, unknown> & {
  id: string;
  created?: string;
  updated?: string;
  created_at?: string;
  updated_at?: string;
};

export type PocketBaseRecord = {
  id: string;
  created?: string;
  updated?: string;
  created_at: string;
  updated_at: string;
};

export type UserProfile = PocketBaseRecord & {
  email: string | null;
  username: string | null;
};

export type PocketBaseAuth = {
  token: string;
  user: UserProfile;
};

export type PocketBaseList<T> = {
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  items: T[];
};

export type PocketBaseError = Error & {
  status?: number;
};
