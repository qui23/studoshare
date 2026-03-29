-- Update documents storage bucket file size limit from 50MB to 200MB
UPDATE storage.buckets
SET file_size_limit = 209715200
WHERE id = 'documents';
