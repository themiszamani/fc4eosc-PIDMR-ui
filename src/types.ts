// Types for supported PIDS view
export type ApiResponse = {
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
  resolution_modes: ResolutionMode[];
  regexes: string[];
  status?: string;
  example?: string;
  user_id: string | null;
};

export type ResolutionMode = {
  mode: string;
  name: string;
};

export type ProviderInput = {
  type: string;
  name: string;
  description: string;
  resolution_modes: string[];
  regexes: string[];
  example?: string;
};
