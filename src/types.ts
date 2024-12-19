// Types for supported PIDS view
export type ApiResponse = {
  size: unknown;
  size_of_page: number;
  number_of_page: number;
  total_elements: number;
  total_pages: number;
  content: Provider[];
  links: ApiResponseLink[];
};

export type ProfileResponse = {
  id: string;
  roles: string[];
};

export type ApiResponseLink = {
  href: string;
  rel: string;
};

export type Provider = {
  id: number;
  type: string;
  name: string;
  description: string;
  relies_on_dois: boolean;
  resolution_modes: ResolutionMode[];
  regexes: string[];
  status?: string;
  example?: string;
  user_id: string | null;
};

export type ResolutionMode = {
  name: string;
  mode: string;
  endpoints: string[];
};

export type ProviderInput = {
  type: string;
  name: string;
  description: string;
  relies_on_dois: boolean;
  resolution_modes: ResolutionMode[];
  regexes: string[];
  example?: string;
};

export type RoleChangeRequest = {
  id: number;
  user_id: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  description: string;
  requested_on: string;
  updated_on: string;
  updated_by: string;
  status: string;
};

export interface UserList {
  id: string;
  roles: string[];
  name: string;
  surname: string;
  email: string;
}
