-- Delete existing intermediate lessons to replace with full curriculum
DELETE FROM public.lessons WHERE level = 'intermediate';
