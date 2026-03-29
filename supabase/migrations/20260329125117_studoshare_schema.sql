-- StudoShare Schema Migration
-- Tables: user_profiles, documents, comments

-- 1. user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  university TEXT NOT NULL DEFAULT '',
  doc_type TEXT NOT NULL DEFAULT '',
  course_code TEXT,
  semester TEXT,
  year TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  file_type TEXT NOT NULL DEFAULT '',
  download_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. comment_upvotes table (to track who upvoted what)
CREATE TABLE IF NOT EXISTS public.comment_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comment_upvotes_unique ON public.comment_upvotes(comment_id, user_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_documents_uploader_id ON public.documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_subject ON public.documents(subject);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON public.documents(visibility);
CREATE INDEX IF NOT EXISTS idx_comments_document_id ON public.comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 6. Functions

-- Auto-create user_profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- 7. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_upvotes ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies

-- user_profiles
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "public_read_user_profiles" ON public.user_profiles;
CREATE POLICY "public_read_user_profiles"
ON public.user_profiles
FOR SELECT
TO public
USING (true);

-- documents: public can read public docs, authenticated users manage their own
DROP POLICY IF EXISTS "public_read_public_documents" ON public.documents;
CREATE POLICY "public_read_public_documents"
ON public.documents
FOR SELECT
TO public
USING (visibility = 'public');

DROP POLICY IF EXISTS "authenticated_read_all_documents" ON public.documents;
CREATE POLICY "authenticated_read_all_documents"
ON public.documents
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "users_manage_own_documents" ON public.documents;
CREATE POLICY "users_manage_own_documents"
ON public.documents
FOR ALL
TO authenticated
USING (uploader_id = auth.uid())
WITH CHECK (uploader_id = auth.uid());

-- comments: public read, authenticated write own
DROP POLICY IF EXISTS "public_read_comments" ON public.comments;
CREATE POLICY "public_read_comments"
ON public.comments
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "users_manage_own_comments" ON public.comments;
CREATE POLICY "users_manage_own_comments"
ON public.comments
FOR ALL
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- comment_upvotes
DROP POLICY IF EXISTS "users_manage_own_upvotes" ON public.comment_upvotes;
CREATE POLICY "users_manage_own_upvotes"
ON public.comment_upvotes
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "public_read_upvotes" ON public.comment_upvotes;
CREATE POLICY "public_read_upvotes"
ON public.comment_upvotes
FOR SELECT
TO public
USING (true);

-- 9. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS set_documents_updated_at ON public.documents;
CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_comments_updated_at ON public.comments;
CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "public_read_documents_storage" ON storage.objects;
CREATE POLICY "public_read_documents_storage"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "authenticated_upload_documents" ON storage.objects;
CREATE POLICY "authenticated_upload_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users_delete_own_documents" ON storage.objects;
CREATE POLICY "users_delete_own_documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND owner::uuid = auth.uid());
