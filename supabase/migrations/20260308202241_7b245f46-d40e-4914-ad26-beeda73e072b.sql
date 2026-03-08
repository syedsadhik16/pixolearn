
-- Shop items table
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'avatar',
  icon text NOT NULL DEFAULT '🎁',
  xp_cost integer NOT NULL DEFAULT 100,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available shop items"
ON public.shop_items FOR SELECT
USING (is_available = true);

-- Purchased items table
CREATE TABLE public.purchased_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  is_equipped boolean NOT NULL DEFAULT false,
  UNIQUE(student_id, item_id)
);

ALTER TABLE public.purchased_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own purchases"
ON public.purchased_items FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Students can insert own purchases"
ON public.purchased_items FOR INSERT
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own purchases"
ON public.purchased_items FOR UPDATE
USING (student_id = auth.uid());

-- Seed shop items
INSERT INTO public.shop_items (name, description, category, icon, xp_cost) VALUES
-- Avatar items
('Cool Shades', 'Stylish sunglasses for your avatar', 'avatar', '😎', 50),
('Crown', 'A golden crown fit for a king', 'avatar', '👑', 200),
('Wizard Hat', 'A magical wizard hat', 'avatar', '🧙', 150),
('Superhero Cape', 'Fly through lessons!', 'avatar', '🦸', 300),
('Space Helmet', 'Explore the universe of English', 'avatar', '🚀', 250),
('Ninja Mask', 'Stealthy learner vibes', 'avatar', '🥷', 175),
('Party Hat', 'Celebrate your achievements', 'avatar', '🥳', 75),
('Robot Face', 'Beep boop, learning mode!', 'avatar', '🤖', 125),
-- Themes
('Ocean Theme', 'Cool blue ocean vibes', 'theme', '🌊', 400),
('Forest Theme', 'Peaceful green forest', 'theme', '🌲', 400),
('Galaxy Theme', 'Stars and nebulae', 'theme', '🌌', 500),
('Sunset Theme', 'Warm sunset colors', 'theme', '🌅', 350),
('Candy Theme', 'Sweet and colorful', 'theme', '🍬', 300),
-- Emotes
('Fireworks', 'Celebration emote on lesson complete', 'emote', '🎆', 100),
('Confetti', 'Party time emote', 'emote', '🎊', 80),
('Lightning', 'Electric streak effect', 'emote', '⚡', 150),
('Rainbow', 'Rainbow trail effect', 'emote', '🌈', 200);
