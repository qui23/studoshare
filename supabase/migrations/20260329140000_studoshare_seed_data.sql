-- StudoShare Seed Data Migration
-- Creates demo users and sample documents for immediate app functionality

DO $$
DECLARE
    user1_uuid UUID := gen_random_uuid();
    user2_uuid UUID := gen_random_uuid();
    user3_uuid UUID := gen_random_uuid();
    doc1_uuid UUID := gen_random_uuid();
    doc2_uuid UUID := gen_random_uuid();
    doc3_uuid UUID := gen_random_uuid();
    doc4_uuid UUID := gen_random_uuid();
    doc5_uuid UUID := gen_random_uuid();
    doc6_uuid UUID := gen_random_uuid();
    doc7_uuid UUID := gen_random_uuid();
    doc8_uuid UUID := gen_random_uuid();
BEGIN
    -- Create demo auth users (trigger will auto-create user_profiles)
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (user1_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'priya@studoshare.demo', crypt('demo123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Priya Kapoor', 'role', 'contributor'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user2_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'marcus@studoshare.demo', crypt('demo123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Marcus Chen', 'role', 'contributor'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (user3_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@studoshare.demo', crypt('demo123456', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Rahul Sharma', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Wait for trigger to create user_profiles, then insert documents
    -- Insert sample documents
    INSERT INTO public.documents (
        id, uploader_id, title, description, subject, university, doc_type,
        course_code, semester, year, visibility, tags,
        file_path, file_name, file_size, file_type, download_count, created_at
    ) VALUES
        (doc1_uuid, user1_uuid,
         'Complete Calculus II — Integration Techniques & Series',
         'Comprehensive notes covering all integration methods: substitution, parts, partial fractions, trigonometric, plus power series and convergence tests.',
         'Mathematics', 'MIT', 'Lecture Notes',
         'MATH 18.02', 'Spring', '2026', 'public',
         ARRAY['calculus', 'integration', 'series', 'convergence'],
         'demo/calculus-ii-notes.pdf', 'calculus-ii-notes.pdf', 4300000, 'application/pdf', 5420,
         now() - interval '7 days'),
        (doc2_uuid, user2_uuid,
         'Data Structures & Algorithms — Interview Prep Complete Guide',
         'Arrays, linked lists, trees, graphs, dynamic programming, sorting algorithms with complexity analysis. Includes 150+ solved problems.',
         'Computer Science', 'Stanford University', 'Summary / Cheat Sheet',
         'CS 161', 'Fall', '2025', 'public',
         ARRAY['algorithms', 'dsa', 'interview', 'data-structures'],
         'demo/dsa-guide.pdf', 'dsa-guide.pdf', 8900000, 'application/pdf', 12300,
         now() - interval '4 days'),
        (doc3_uuid, user3_uuid,
         'Quantum Mechanics Lecture Slides — Chapters 1–8',
         'Official lecture slides covering wave functions, Schrodinger equation, uncertainty principle, and quantum harmonic oscillator.',
         'Physics', 'IIT Bombay', 'Presentation Slides',
         'PHY 301', 'Spring', '2026', 'public',
         ARRAY['quantum', 'physics', 'waves', 'schrodinger'],
         'demo/quantum-slides.pdf', 'quantum-slides.pdf', 12000000, 'application/pdf', 3210,
         now() - interval '11 days'),
        (doc4_uuid, user1_uuid,
         'Machine Learning — Linear Regression to Neural Networks',
         'Step-by-step ML fundamentals with Python code examples. Covers supervised learning, gradient descent, backpropagation, and CNNs.',
         'Computer Science', 'UCLA', 'Lecture Notes',
         'CS 229', 'Fall', '2025', 'public',
         ARRAY['ml', 'neural-networks', 'python', 'deep-learning'],
         'demo/ml-notes.pdf', 'ml-notes.pdf', 7200000, 'application/pdf', 8940,
         now() - interval '2 days'),
        (doc5_uuid, user2_uuid,
         'Organic Chemistry Reaction Mechanisms — Complete Reference',
         'All major reaction mechanisms: SN1, SN2, E1, E2, addition, elimination, substitution with arrow-pushing diagrams.',
         'Chemistry', 'Oxford University', 'Summary / Cheat Sheet',
         'CHEM 201', 'Spring', '2026', 'public',
         ARRAY['organic', 'reactions', 'mechanisms', 'chemistry'],
         'demo/organic-chem.pdf', 'organic-chem.pdf', 5100000, 'application/pdf', 4560,
         now() - interval '14 days'),
        (doc6_uuid, user3_uuid,
         'Microeconomics — Consumer Theory & Market Structures',
         'Detailed notes on utility maximization, demand curves, perfect competition, monopoly, oligopoly with diagrams and practice questions.',
         'Economics', 'Harvard University', 'Lecture Notes',
         'ECON 101', 'Fall', '2025', 'public',
         ARRAY['economics', 'microeconomics', 'markets', 'consumer-theory'],
         'demo/microeconomics.pdf', 'microeconomics.pdf', 3400000, 'application/pdf', 1870,
         now() - interval '9 days'),
        (doc7_uuid, user1_uuid,
         'Operating Systems — Process Management & Memory',
         'Covers process scheduling, deadlocks, virtual memory, paging, segmentation, and file systems with diagrams and exam-style questions.',
         'Computer Science', 'TU Berlin', 'Lecture Notes',
         'CS 340', 'Spring', '2026', 'public',
         ARRAY['os', 'memory', 'scheduling', 'processes'],
         'demo/os-notes.pdf', 'os-notes.pdf', 4800000, 'application/pdf', 2780,
         now() - interval '19 days'),
        (doc8_uuid, user2_uuid,
         'Linear Algebra — Matrices, Eigenvalues & Vector Spaces',
         'Lecture notes plus solved exercises on matrix operations, determinants, eigenvectors, linear transformations, and inner product spaces.',
         'Mathematics', 'MIT', 'Lecture Notes',
         'MATH 18.06', 'Fall', '2025', 'public',
         ARRAY['linear-algebra', 'matrices', 'eigenvalues', 'vectors'],
         'demo/linear-algebra.pdf', 'linear-algebra.pdf', 5600000, 'application/pdf', 6120,
         now() - interval '28 days')
    ON CONFLICT (id) DO NOTHING;

    -- Insert sample comments on the first document
    INSERT INTO public.comments (id, document_id, author_id, parent_id, content, upvotes, created_at)
    VALUES
        (gen_random_uuid(), doc1_uuid, user2_uuid, null,
         'This is exactly what I needed for my exam prep! The section on integration by parts is especially clear.',
         12, now() - interval '5 days'),
        (gen_random_uuid(), doc1_uuid, user3_uuid, null,
         'Great resource. I would recommend pairing this with practice problems from MIT OpenCourseWare.',
         8, now() - interval '3 days'),
        (gen_random_uuid(), doc1_uuid, user1_uuid, null,
         'Thank you all for the kind words! I will be uploading Calculus III notes next week.',
         5, now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Seed data insertion encountered an issue: %', SQLERRM;
END $$;
