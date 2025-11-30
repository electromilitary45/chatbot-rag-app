-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  userId uuid NOT NULL,
  type text NOT NULL,
  provider text NOT NULL,
  providerAccountId text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  CONSTRAINT accounts_pkey PRIMARY KEY (id),
  CONSTRAINT accounts_userid_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nuevo Chat'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  filename text NOT NULL,
  file_type text NOT NULL,
  file_size integer,
  file_url text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT documents_pkey PRIMARY KEY (id),
  CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid,
  content text NOT NULL,
  embedding vector,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT embeddings_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sessionToken text NOT NULL UNIQUE,
  userId uuid NOT NULL,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_userid_fkey FOREIGN KEY (userId) REFERENCES public.users(id)
);
CREATE TABLE public.signup_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT signup_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  email text UNIQUE,
  emailVerified timestamp with time zone,
  image text,
  password text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL UNIQUE,
  expires timestamp with time zone NOT NULL,
  CONSTRAINT verification_tokens_pkey PRIMARY KEY (identifier, token)
);
