
-- Update all advanced lessons to have proper vocabulary and sentences JSON structure
-- The app expects vocabulary as [{word, phonetic, meaning}] and sentences as [{text, translation}]

-- We'll use a function to transform the data
DO $$
DECLARE
  r RECORD;
  new_vocab jsonb;
  new_sentences jsonb;
  v text;
  s text;
  i int;
BEGIN
  FOR r IN SELECT id, vocabulary, sentences FROM lessons WHERE level = 'advanced'
  LOOP
    -- Transform vocabulary: from ["word1","word2"] to [{"word":"word1","phonetic":"","meaning":""}]
    new_vocab := '[]'::jsonb;
    IF jsonb_typeof(r.vocabulary) = 'array' THEN
      FOR i IN 0..jsonb_array_length(r.vocabulary) - 1
      LOOP
        v := r.vocabulary->>i;
        -- Check if it's already an object
        IF jsonb_typeof(r.vocabulary->i) = 'object' THEN
          new_vocab := new_vocab || jsonb_build_array(r.vocabulary->i);
        ELSE
          new_vocab := new_vocab || jsonb_build_array(
            jsonb_build_object('word', v, 'phonetic', '', 'meaning', initcap(v))
          );
        END IF;
      END LOOP;
    END IF;

    -- Transform sentences: from ["text1","text2"] to [{"text":"text1","translation":""}]
    new_sentences := '[]'::jsonb;
    IF jsonb_typeof(r.sentences) = 'array' THEN
      FOR i IN 0..jsonb_array_length(r.sentences) - 1
      LOOP
        s := r.sentences->>i;
        IF jsonb_typeof(r.sentences->i) = 'object' THEN
          new_sentences := new_sentences || jsonb_build_array(r.sentences->i);
        ELSE
          new_sentences := new_sentences || jsonb_build_array(
            jsonb_build_object('text', s, 'translation', '')
          );
        END IF;
      END LOOP;
    END IF;

    UPDATE lessons SET vocabulary = new_vocab, sentences = new_sentences WHERE id = r.id;
  END LOOP;
END $$;
