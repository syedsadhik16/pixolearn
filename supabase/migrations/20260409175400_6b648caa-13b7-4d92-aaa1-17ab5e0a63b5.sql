
-- Add new columns to learner_profiles
ALTER TABLE public.learner_profiles 
ADD COLUMN IF NOT EXISTS child_name text,
ADD COLUMN IF NOT EXISTS english_level text;

-- Add override_flag to user_entitlements
ALTER TABLE public.user_entitlements
ADD COLUMN IF NOT EXISTS override_flag boolean DEFAULT false;

-- Insert Level 2
INSERT INTO public.curriculum_levels (id, level_code, level_name, age_group, duration_days, duration_months, pedagogy_model, hidden_mastery_rule, final_badge, status)
VALUES (
  'b2a1c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  'level_2',
  'Level 2 - Visible Reading to Sentences',
  '6-10', 180, 6,
  'confidence-first, reading-bridge, grammar-thread, adaptive, gamified, emotionally safe',
  'accuracy >= 80% and reading-fluency >= 3/5',
  'Sentence Reader Champion', 'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert Level 3
INSERT INTO public.curriculum_levels (id, level_code, level_name, age_group, duration_days, duration_months, pedagogy_model, hidden_mastery_rule, final_badge, status)
VALUES (
  'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
  'level_3',
  'Level 3 - Comprehension & Guided Writing',
  '8-14', 180, 6,
  'confidence-first, comprehension-focus, vocabulary-expansion, guided-writing, adaptive, gamified, emotionally safe',
  'accuracy >= 80% and comprehension >= 3/5',
  'Fluent Reader Champion', 'active'
) ON CONFLICT (id) DO NOTHING;

-- ==================== LEVEL 2 & 3 MONTHS, WEEKS, DAYS via DO block ====================
DO $$
DECLARE
  l2_id uuid := 'b2a1c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
  l3_id uuid := 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f';
  -- Level 2 month IDs
  l2m uuid[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  -- Level 3 month IDs
  l3m uuid[] := ARRAY[
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid(),
    gen_random_uuid(), gen_random_uuid(), gen_random_uuid()
  ];
  l2_month_titles text[] := ARRAY['Level 1 to Level 2 Reading Bridge','Real Word Reading','Phrase & Short Sentence Reading','Grammar Basics & Sentence Building','Chunk Reading & Longer Words','Mini Paragraphs & Level 3 Bridge'];
  l2_month_goals text[] := ARRAY['Turn familiar blend families into visible reading and first real words','Read real CVC and CCVC words independently','Read 3-5 word phrases and short sentences','Use basic grammar in reading and speaking','Read 5-6 letter words using chunk strategy','Read mini paragraphs and answer simple questions'];
  l2_month_badges text[] := ARRAY['Bridge Builder','Word Explorer','Phrase Master','Grammar Scout','Chunk Champion','Sentence Reader Champion'];
  l3_month_titles text[] := ARRAY['Syllable Building & Two-Syllable Reading','Descriptive Language & Grammar Expansion','Paragraph Reading & Comprehension','Story Logic & Sequence','Connectors & Complex Sentences','Guided Writing & Expression'];
  l3_month_goals text[] := ARRAY['Move from short-word fluency into two-syllable reading','Use adjectives, adverbs, and richer sentence structures','Read paragraphs and answer who/what/where/when/why questions','Understand story structure, sequence events, make predictions','Use connectors and build complex sentences','Write short guided paragraphs and mini-stories independently'];
  l3_month_badges text[] := ARRAY['Syllable Scout','Grammar Explorer','Comprehension Star','Story Navigator','Connector Master','Fluent Reader Champion'];
  -- Week storage
  l2_weeks uuid[];
  l3_weeks uuid[];
  w_id uuid;
  i integer;
  -- Level 2 week data
  l2w_titles text[] := ARRAY[
    'Visible blend families M/S/L','Visible blend families T/N/P','Visible blend families B/D/G','Blend review + first real words','Month 1 consolidation',
    'CVC real words -at -an -ap','CVC real words -ig -in -it','CVC real words -ot -op -og','CVC real words -ub -ug -ut','Sight words + review',
    'Two-word phrases','Three-word phrases','Simple sentences','Sentence reading practice','Month 3 review',
    'Naming words & action words','Is/am/are + pronouns','Question sentences','Sentence expansion','Month 4 grammar review',
    'Two-syllable words','Chunk reading strategy','Compound words','Mini paragraphs','Month 5 fluency check',
    'Paragraph reading','Simple comprehension','Level 3 preview','Final review + celebration','Level 2 completion'
  ];
  l2w_focus text[] := ARRAY[
    'ma me mi mo mu sa se si so su la le li lo lu','ta te ti to tu na ne ni no nu pa pe pi po pu','ba be bi bo bu da de di do du ga ge gi go gu','Review all blend families, first words','Review all Month 1 blends',
    'cat bat mat sat, man pan fan can, map cap tap','big dig pig, bin fin pin, bit fit sit','hot dot pot, hop top mop, dog fog log','rub tub sub, bug hug mug, but cut nut','the is a I and to, review CVC',
    'a cat, the dog, my pen, big cup','a big cat, the red cup, I can run','The cat sat. I can run. He is big.','She has a pen. The dog can sit.','Review phrases and sentences',
    'Nouns and verbs in sentences','He is, She is, I am, They are','Is it? Can you? Do they? What is?','Add adjectives and details','Review all grammar patterns',
    'garden, rabbit, kitten, basket, muffin','com-pu-ter, li-bra-ry, beau-ti-ful','sunflower, rainbow, football, bedroom','Read connected sentences about a topic','Fluency assessment',
    '4-5 sentence paragraphs','Read and answer who/what/where questions','Introduction to longer texts','Review all Level 2 skills','Final assessment and Level 3 bridge'
  ];
  l2w_rewards text[] := ARRAY[
    'Blend Family Star','Reading Builder','Sound Bridge Builder','Word Spotter','Bridge Complete',
    'CVC Explorer','Word Builder','Reading Star','Word Champion','Word Explorer',
    'Phrase Starter','Phrase Builder','Sentence Starter','Sentence Reader','Phrase Master',
    'Grammar Starter','Pronoun Pro','Question Maker','Sentence Expander','Grammar Scout',
    'Syllable Spotter','Chunk Reader','Compound Explorer','Paragraph Starter','Chunk Champion',
    'Paragraph Reader','Comprehension Star','Level Up Preview','Level 2 Graduate','Sentence Reader Champion'
  ];
  -- Level 3 week data
  l3w_titles text[] := ARRAY[
    'Two-syllable word review','Multi-syllable words','Prefixes un- re- pre-','Suffixes -ed -ing -ly','Month 1 consolidation',
    'Adjectives in reading','Adverbs and sentence building','Richer sentences','Vocabulary expansion','Month 2 review',
    'Short paragraph reading','Who/What/Where questions','When/Why questions','Main idea & details','Month 3 comprehension check',
    'Story beginning/middle/end','Sequence of events','Making predictions','Character & setting','Month 4 story review',
    'Connectors: and, but, or','Connectors: because, so, although','Complex sentence building','Short paragraph writing','Month 5 writing review',
    'Guided story writing','Opinion writing','Reading comprehension mastery','Final review + celebration','Level 3 completion'
  ];
  l3w_focus text[] := ARRAY[
    'garden, rabbit, kitten fluency','umbrella, beautiful, elephant, computer','unhappy, redo, preview, unlock','jumped, running, quickly, slowly','Review syllables, prefixes, suffixes',
    'big/small, happy/sad in sentences','quickly, slowly, carefully in context','adjective + noun + verb + adverb','Synonyms, antonyms, context clues','Review descriptive language',
    '3-4 sentence paragraphs','Answer literal questions','Answer inferential questions','Identify main idea and details','Review comprehension skills',
    'Identify parts of a story','Put events in order','Predict what happens next','Identify characters, settings, feelings','Review story elements',
    'Use basic connectors in sentences','Use cause-effect connectors','Build sentences with multiple clauses','Write 3-sentence paragraphs','Review connectors and writing',
    'Write a short story with structure','Express opinions with reasons','Advanced comprehension passages','Review all Level 3 skills','Final assessment and certification'
  ];
  l3w_rewards text[] := ARRAY[
    'Syllable Starter','Multi-Syllable Star','Prefix Explorer','Suffix Builder','Syllable Scout',
    'Describing Star','Adverb Explorer','Sentence Builder','Vocabulary Star','Grammar Explorer',
    'Paragraph Starter','Question Solver','Thinking Reader','Main Idea Master','Comprehension Star',
    'Story Starter','Sequence Star','Prediction Pro','Character Explorer','Story Navigator',
    'Connector Starter','Connector Builder','Complex Writer','Paragraph Writer','Connector Master',
    'Story Writer','Opinion Star','Reading Champion','Level 3 Graduate','Fluent Reader Champion'
  ];
  -- Day seeding vars
  day_id uuid;
  week_idx integer;
  -- L2 Day data
  l2d_titles text[] := ARRAY[
    'ma, me, mi','mo, mu + review','sa, se, si','so, su + review','la, le, li','lo, lu + M/S/L review',
    'ta, te, ti','to, tu + review','na, ne, ni','no, nu + review','pa, pe, pi','po, pu + T/N/P review',
    'ba, be, bi','bo, bu + review','da, de, di','do, du + review','ga, ge, gi','go, gu + B/D/G review',
    'map, sit, pen','dog, cup, sun','big, red, hot','run, fun, hop','cat, bat, hat','First words review',
    'All blend families review','Real words mixed practice','Sentence intro: I can','Sentence intro: It is','Month 1 celebration','Month 1 gate day'
  ];
  l2d_games text[] := ARRAY[
    'Tap the Right Tile','Tap the Right Tile','Sound Match','Sound Match','Blend Builder','Blend Builder',
    'Tap the Right Tile','Tap the Right Tile','Sound Match','Sound Match','Blend Builder','Blend Builder',
    'Tap the Right Tile','Tap the Right Tile','Sound Match','Sound Match','Blend Builder','Blend Builder',
    'Word Builder Blocks','Word Builder Blocks','Basket Sort','Basket Sort','Memory Flip','Memory Flip',
    'Mixed Review Game','Mixed Review Game','Sentence Builder','Sentence Builder','Celebration Game','Gate Challenge'
  ];
  l2d_badges text[] := ARRAY[
    'First Reader','Blend Buddy','Sound Spotter','Review Star','Blend Master','Week 1 Star',
    'T-N-P Starter','Blend Reader','Sound Explorer','Review Champion','Pattern Pro','Week 2 Star',
    'B-D-G Starter','Blend Builder','Sound Detective','Review Ace','Pattern Master','Week 3 Star',
    'Word Spotter','Real Reader','Color Words','Action Reader','Word Family Pro','Week 4 Star',
    'Review Star','Practice Pro','Sentence Starter','Sentence Reader','Month 1 Champion','Gate Passed'
  ];
  -- L3 Day data
  l3d_titles text[] := ARRAY[
    'garden, rabbit review','kitten, basket, muffin','Two-syllable fluency drill','Two-syllable in sentences','Mixed two-syllable reading','Week 1 confidence check',
    'umbrella, beautiful','elephant, computer','library, butterfly','Multi-syllable in context','Multi-syllable fluency','Week 2 celebration',
    'un- prefix: unhappy, unlock','re- prefix: redo, rewrite','pre- prefix: preview, preschool','Mixed prefix practice','Prefix in sentences','Week 3 review',
    '-ed suffix: jumped, walked','-ing suffix: running, playing','-ly suffix: quickly, slowly','Mixed suffix practice','Suffix in sentences','Week 4 celebration',
    'Syllable + prefix review','Suffix review + practice','Mixed morphology reading','Sentences with all skills','Month 1 celebration','Month 1 gate day'
  ];
  l3d_games text[] := ARRAY[
    'Syllable Tap','Syllable Tap','Speed Read','Sentence Match','Mixed Challenge','Confidence Check',
    'Syllable Builder','Syllable Builder','Word Explorer','Context Match','Fluency Race','Celebration Game',
    'Prefix Match','Prefix Match','Prefix Builder','Mixed Sort','Sentence Builder','Review Game',
    'Suffix Sort','Suffix Sort','Suffix Builder','Mixed Match','Sentence Expand','Celebration Game',
    'Mixed Review','Mixed Review','Morphology Match','Sentence Challenge','Celebration Game','Gate Challenge'
  ];
  l3d_badges text[] := ARRAY[
    'Syllable Starter','Syllable Reader','Fluency Star','Sentence Pro','Mixed Master','Week 1 Star',
    'Big Word Reader','Word Explorer','Library Pro','Context Star','Fluency Champion','Week 2 Star',
    'Prefix Pioneer','Re-Reader','Pre-Reader','Prefix Pro','Sentence Builder','Week 3 Star',
    'Past Tense Star','Action Reader','Adverb Pro','Suffix Star','Sentence Expander','Week 4 Star',
    'Review Star','Suffix Master','Morphology Pro','Sentence Champion','Month 1 Champion','Gate Passed'
  ];
BEGIN
  -- Insert Level 2 months
  FOR i IN 1..6 LOOP
    INSERT INTO public.curriculum_months (id, level_id, month_number, month_title, month_goal, pedagogical_emphasis, milestone_badge, sort_order)
    VALUES (l2m[i], l2_id, i, l2_month_titles[i], l2_month_goals[i], '', l2_month_badges[i], i);
  END LOOP;
  
  -- Insert Level 3 months
  FOR i IN 1..6 LOOP
    INSERT INTO public.curriculum_months (id, level_id, month_number, month_title, month_goal, pedagogical_emphasis, milestone_badge, sort_order)
    VALUES (l3m[i], l3_id, i, l3_month_titles[i], l3_month_goals[i], '', l3_month_badges[i], i);
  END LOOP;

  -- Insert Level 2 weeks (30)
  l2_weeks := ARRAY[]::uuid[];
  FOR i IN 1..30 LOOP
    w_id := gen_random_uuid();
    l2_weeks := array_append(l2_weeks, w_id);
    INSERT INTO public.curriculum_weeks (id, level_id, month_id, week_number, week_title, weekly_focus, weekly_reward_label, sort_order)
    VALUES (w_id, l2_id, l2m[LEAST(((i-1)/5)+1, 6)], i, l2w_titles[i], l2w_focus[i], l2w_rewards[i], i);
  END LOOP;

  -- Insert Level 3 weeks (30)
  l3_weeks := ARRAY[]::uuid[];
  FOR i IN 1..30 LOOP
    w_id := gen_random_uuid();
    l3_weeks := array_append(l3_weeks, w_id);
    INSERT INTO public.curriculum_weeks (id, level_id, month_id, week_number, week_title, weekly_focus, weekly_reward_label, sort_order)
    VALUES (w_id, l3_id, l3m[LEAST(((i-1)/5)+1, 6)], i, l3w_titles[i], l3w_focus[i], l3w_rewards[i], i);
  END LOOP;

  -- Insert Level 2 Days (Month 1: 30 days)
  FOR i IN 1..30 LOOP
    week_idx := LEAST(((i-1) / 6) + 1, 5);
    day_id := gen_random_uuid();
    INSERT INTO public.curriculum_days (id, level_id, month_id, week_id, day_number, title, theme, main_game, reward_badge, day_objective, daily_xp, status, target_content, target_skills, parent_todays_target, parent_words_learned, parent_confidence_note, parent_home_practice, parent_praise_line)
    VALUES (day_id, l2_id, l2m[1], l2_weeks[week_idx], i, l2d_titles[i],
      CASE WHEN i<=6 THEN 'Visible blend families M/S/L' WHEN i<=12 THEN 'Visible blend families T/N/P' WHEN i<=18 THEN 'Visible blend families B/D/G' WHEN i<=24 THEN 'Blend review + first real words' ELSE 'Month 1 consolidation' END,
      l2d_games[i], l2d_badges[i], 'Read and recognise: ' || l2d_titles[i], 50, 'active',
      jsonb_build_object('target', l2d_titles[i]), jsonb_build_array('visible_reading','blend_recognition'),
      'Focus: ' || l2d_titles[i], l2d_titles[i], 'Building reading confidence', 'Practice reading: ' || l2d_titles[i], 'Great reading progress!');
    
    INSERT INTO public.curriculum_day_parts (curriculum_day_id, part_number, part_name, interaction_type, xp_value, sort_order, duration_minutes) VALUES
    (day_id,1,'Recall Warm-Up','listen',5,1,5),(day_id,2,'New Reading Input','observe',5,2,5),(day_id,3,'Guided Reading','repeat',10,3,5),
    (day_id,4,'Topic Game','game',10,4,5),(day_id,5,'Speaking + Grammar','speak',10,5,5),(day_id,6,'Praise + Soft Check','celebrate',10,6,5);
  END LOOP;

  -- Insert Level 3 Days (Month 1: 30 days)
  FOR i IN 1..30 LOOP
    week_idx := LEAST(((i-1) / 6) + 1, 5);
    day_id := gen_random_uuid();
    INSERT INTO public.curriculum_days (id, level_id, month_id, week_id, day_number, title, theme, main_game, reward_badge, day_objective, daily_xp, status, target_content, target_skills, parent_todays_target, parent_words_learned, parent_confidence_note, parent_home_practice, parent_praise_line)
    VALUES (day_id, l3_id, l3m[1], l3_weeks[week_idx], i, l3d_titles[i],
      CASE WHEN i<=6 THEN 'Two-syllable word review' WHEN i<=12 THEN 'Multi-syllable words' WHEN i<=18 THEN 'Prefixes un- re- pre-' WHEN i<=24 THEN 'Suffixes -ed -ing -ly' ELSE 'Month 1 consolidation' END,
      l3d_games[i], l3d_badges[i], 'Master: ' || l3d_titles[i], 50, 'active',
      jsonb_build_object('target', l3d_titles[i]), jsonb_build_array('syllable_reading','morphology','comprehension'),
      'Focus: ' || l3d_titles[i], l3d_titles[i], 'Building comprehension skills', 'Practice: ' || l3d_titles[i], 'Excellent reading progress!');
    
    INSERT INTO public.curriculum_day_parts (curriculum_day_id, part_number, part_name, interaction_type, xp_value, sort_order, duration_minutes) VALUES
    (day_id,1,'Warm-Up / Recall','listen',5,1,5),(day_id,2,'New Input','observe',5,2,5),(day_id,3,'Guided Reading','repeat',10,3,5),
    (day_id,4,'Main Game','game',10,4,5),(day_id,5,'Speaking / Writing','speak',10,5,5),(day_id,6,'Soft Check + Celebration','celebrate',10,6,5);
  END LOOP;
END $$;
