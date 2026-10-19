-- ============================================================================
-- Tanggap - Database Schema (Supabase Postgres)
-- Platform Form Builder, Survei & Analisis Respons
-- Versi 3.0
-- ============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. WORKSPACES
create table if not exists public.workspaces (
    id uuid primary key default uuid_generate_v4(),
    name text not null default 'Organisasi Saya',
    logo_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROFILES (Extends auth.users)
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    workspace_id uuid references public.workspaces(id) on delete set null,
    full_name text not null default '',
    role text not null check (role in ('owner', 'editor', 'viewer')) default 'editor',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. FORMS
create table if not exists public.forms (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references public.workspaces(id) on delete cascade,
    owner_id uuid references auth.users(id) on delete set null,
    title text not null,
    description text default '',
    slug text not null unique,
    status text not null check (status in ('draft', 'published', 'closed')) default 'draft',
    banner_url text,
    settings jsonb default '{
        "is_anonymous": false,
        "show_branding": true,
        "limit_one_response": false,
        "quota": null,
        "thank_you_message": "Terima kasih atas partisipasi Anda dalam mengisi survei ini.",
        "redirect_url": null,
        "notify_admin_email": null
    }'::jsonb,
    opens_at timestamp with time zone,
    closes_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. FORM FIELDS
create table if not exists public.form_fields (
    id uuid primary key default uuid_generate_v4(),
    form_id uuid not null references public.forms(id) on delete cascade,
    position integer not null default 0,
    type text not null check (type in (
        'text',
        'textarea',
        'number',
        'email',
        'phone',
        'date',
        'radio',
        'select',
        'checkbox',
        'rating',
        'linear_scale',
        'file_upload',
        'matrix',
        'ranking'
    )),
    label text not null,
    help_text text default '',
    required boolean not null default false,
    options jsonb default '[]'::jsonb,
    validation jsonb default '{}'::jsonb,
    logic jsonb default '[]'::jsonb,
    section integer not null default 1,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. RESPONSES
create table if not exists public.responses (
    id uuid primary key default uuid_generate_v4(),
    form_id uuid not null references public.forms(id) on delete cascade,
    submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
    respondent_email text,
    respondent_name text,
    ip_hash text,
    user_agent text,
    answers jsonb not null default '{}'::jsonb
);

-- 6. RESPONSE FILES
create table if not exists public.response_files (
    id uuid primary key default uuid_generate_v4(),
    response_id uuid not null references public.responses(id) on delete cascade,
    field_id uuid not null references public.form_fields(id) on delete cascade,
    storage_path text not null,
    mime text,
    size bigint,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. AUDIT LOGS
create table if not exists public.audit_logs (
    id uuid primary key default uuid_generate_v4(),
    workspace_id uuid references public.workspaces(id) on delete cascade,
    actor_id uuid references auth.users(id) on delete set null,
    action text not null,
    entity text not null,
    entity_id text,
    meta jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists idx_forms_slug on public.forms(slug);
create index if not exists idx_forms_workspace_status on public.forms(workspace_id, status);
create index if not exists idx_form_fields_form_id on public.form_fields(form_id, position);
create index if not exists idx_responses_form_submitted on public.responses(form_id, submitted_at desc);
create index if not exists idx_responses_answers_gin on public.responses using gin (answers);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_fields enable row level security;
alter table public.responses enable row level security;
alter table public.response_files enable row level security;
alter table public.audit_logs enable row level security;

-- Helper function to get current user's workspace_id
create or replace function public.current_user_workspace_id()
returns uuid
language sql
stable
security definer
as $$
    select workspace_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Helper function to get current user's role
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
as $$
    select role from public.profiles where id = auth.uid() limit 1;
$$;

-- Workspaces Policies
create policy "Members can view their own workspace"
    on public.workspaces for select
    using (id = public.current_user_workspace_id());

create policy "Owners can update their workspace"
    on public.workspaces for update
    using (id = public.current_user_workspace_id() and public.current_user_role() = 'owner');

-- Profiles Policies
create policy "Users can view members of their workspace"
    on public.profiles for select
    using (workspace_id = public.current_user_workspace_id() or id = auth.uid());

create policy "Users can update their own profile"
    on public.profiles for update
    using (id = auth.uid());

create policy "Owners can update any member role in their workspace"
    on public.profiles for update
    using (workspace_id = public.current_user_workspace_id() and public.current_user_role() = 'owner');

-- Forms Policies
create policy "Users can view forms in their workspace"
    on public.forms for select
    using (
        workspace_id = public.current_user_workspace_id() 
        or status = 'published' -- Allow public reading of published forms
    );

create policy "Owners and editors can insert forms"
    on public.forms for insert
    with check (
        workspace_id = public.current_user_workspace_id() 
        and public.current_user_role() in ('owner', 'editor')
    );

create policy "Owners and editors can update forms"
    on public.forms for update
    using (
        workspace_id = public.current_user_workspace_id() 
        and public.current_user_role() in ('owner', 'editor')
    );

create policy "Owners and editors can delete forms"
    on public.forms for delete
    using (
        workspace_id = public.current_user_workspace_id() 
        and public.current_user_role() in ('owner', 'editor')
    );

-- Form Fields Policies
create policy "Public can view fields of published forms, members can view their workspace fields"
    on public.form_fields for select
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
            and (f.workspace_id = public.current_user_workspace_id() or f.status = 'published')
        )
    );

create policy "Owners and editors can manage form fields"
    on public.form_fields for all
    using (
        exists (
            select 1 from public.forms f
            where f.id = form_fields.form_id
            and f.workspace_id = public.current_user_workspace_id()
            and public.current_user_role() in ('owner', 'editor')
        )
    );

-- Responses Policies
create policy "Workspace members can view responses"
    on public.responses for select
    using (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
            and f.workspace_id = public.current_user_workspace_id()
        )
    );

create policy "Public can submit responses to published active forms"
    on public.responses for insert
    with check (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
            and f.status = 'published'
            and (f.opens_at is null or f.opens_at <= now())
            and (f.closes_at is null or f.closes_at >= now())
        )
    );

create policy "Owners and editors can delete responses"
    on public.responses for delete
    using (
        exists (
            select 1 from public.forms f
            where f.id = responses.form_id
            and f.workspace_id = public.current_user_workspace_id()
            and public.current_user_role() in ('owner', 'editor')
        )
    );

-- Audit Logs Policies
create policy "Members can view audit logs of their workspace"
    on public.audit_logs for select
    using (workspace_id = public.current_user_workspace_id());

create policy "System and users can insert audit logs"
    on public.audit_logs for insert
    with check (workspace_id = public.current_user_workspace_id());

-- ============================================================================
-- STORAGE BUCKETS (run in Supabase SQL editor)
-- ============================================================================
insert into storage.buckets (id, name, public) 
values ('banners', 'banners', true), ('uploads', 'uploads', false)
on conflict (id) do nothing;

