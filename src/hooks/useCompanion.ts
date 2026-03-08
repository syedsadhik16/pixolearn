import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import pixelChar from '@/assets/characters/pixel.png';
import zestChar from '@/assets/characters/zest.png';
import bloomChar from '@/assets/characters/bloom.png';
import sparkChar from '@/assets/characters/spark.png';
import novaChar from '@/assets/characters/nova.png';
import terraChar from '@/assets/characters/terra.png';

const characterImages: Record<string, string> = {
  pixel: pixelChar,
  zest: zestChar,
  bloom: bloomChar,
  spark: sparkChar,
  nova: novaChar,
  terra: terraChar,
};

const characterNames: Record<string, string> = {
  pixel: 'Pixel',
  zest: 'Zest',
  bloom: 'Bloom',
  spark: 'Spark',
  nova: 'Nova',
  terra: 'Terra',
};

export function useCompanion() {
  const { user } = useAuth();
  const [avatarId, setAvatarId] = useState<string>('pixel');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('learner_profiles')
      .select('avatar_character')
      .eq('student_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.avatar_character) setAvatarId(data.avatar_character);
        setLoaded(true);
      });
  }, [user]);

  return {
    avatarId,
    image: characterImages[avatarId] || pixelChar,
    name: characterNames[avatarId] || 'Pixel',
    loaded,
  };
}
