export type UserRole = "owner" | "editor" | "viewer";

export interface Workspace {
  id: string;
  name: string;
  logo_url?: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  workspace_id: string;
  full_name: string;
  email?: string;
  role: UserRole;
  created_at: string;
}

export type FormStatus = "draft" | "published" | "closed";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "radio"
  | "select"
  | "checkbox"
  | "rating"
  | "linear_scale"
  | "file_upload"
  | "matrix"
  | "ranking";

export interface FieldValidation {
  required?: boolean;
  min_length?: number;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  regex?: string;
  custom_error_message?: string;
}

export interface LogicRule {
  target_field_id: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: string | number | string[];
  action: "show" | "hide";
}

export interface FormField {
  id: string;
  form_id?: string;
  position: number;
  type: FieldType;
  label: string;
  help_text?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for radio, select, checkbox, matrix columns
  matrix_rows?: string[]; // for matrix field type
  linear_scale_min?: number; // default 0 or 1
  linear_scale_max?: number; // default 5 or 10
  linear_scale_min_label?: string;
  linear_scale_max_label?: string;
  validation?: FieldValidation;
  logic?: LogicRule[];
  section: number; // For multi-page forms, section 1, 2, ...
}

export interface FormSettings {
  is_anonymous: boolean;
  show_branding: boolean;
  limit_one_response: boolean;
  quota: number | null;
  thank_you_message: string;
  redirect_url: string | null;
  notify_admin_email: string | null;
}

export interface Form {
  id: string;
  workspace_id: string;
  owner_id?: string;
  title: string;
  description: string;
  slug: string;
  status: FormStatus;
  banner_url?: string | null;
  settings: FormSettings;
  opens_at?: string | null;
  closes_at?: string | null;
  created_at: string;
  updated_at: string;
  fields?: FormField[];
  responses_count?: number;
}

export interface FormResponse {
  id: string;
  form_id: string;
  submitted_at: string;
  respondent_email?: string | null;
  respondent_name?: string | null;
  ip_hash?: string | null;
  user_agent?: string | null;
  answers: Record<string, any>; // field_id -> answer value
}

export interface AuditLog {
  id: string;
  workspace_id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity: string;
  entity_id?: string;
  meta?: Record<string, any>;
  created_at: string;
}

