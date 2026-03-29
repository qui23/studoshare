-- Make university column nullable so uploads without a university value succeed
ALTER TABLE public.documents
  ALTER COLUMN university DROP NOT NULL;
