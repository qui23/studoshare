-- Delete all fake/demo documents and their related data
-- Demo documents are identified by file_path starting with 'demo/'

DO $$
BEGIN
    -- Delete comments linked to demo documents
    DELETE FROM public.comments
    WHERE document_id IN (
        SELECT id FROM public.documents WHERE file_path LIKE 'demo/%'
    );

    -- Delete bookmarks linked to demo documents
    DELETE FROM public.bookmarks
    WHERE document_id IN (
        SELECT id FROM public.documents WHERE file_path LIKE 'demo/%'
    );

    -- Delete the demo documents themselves
    DELETE FROM public.documents
    WHERE file_path LIKE 'demo/%';

    RAISE NOTICE 'Demo documents and related data deleted successfully.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Cleanup encountered an issue: %', SQLERRM;
END $$;
