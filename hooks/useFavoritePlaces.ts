import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { FavoritePlace } from '../lib/types';
import { KakaoPlace } from '../lib/kakao';

export function useFavoritePlaces() {
  const [isLoading, setIsLoading] = useState(false);

  const getFavorites = async (userId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('favorite_places')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    setIsLoading(false);
    return { data: data as FavoritePlace[] | null, error };
  };

  const addFavorite = async (userId: string, place: KakaoPlace) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('favorite_places')
      .insert({
        user_id: userId,
        place_name: place.place_name,
        address_name: place.address_name,
        road_address_name: place.road_address_name || null,
        latitude: parseFloat(place.y),
        longitude: parseFloat(place.x),
        phone: place.phone || null,
      })
      .select()
      .single();

    setIsLoading(false);
    return { data: data as FavoritePlace | null, error };
  };

  const removeFavorite = async (id: string) => {
    setIsLoading(true);
    const { error } = await supabase
      .from('favorite_places')
      .delete()
      .eq('id', id);

    setIsLoading(false);
    return { error };
  };

  return {
    isLoading,
    getFavorites,
    addFavorite,
    removeFavorite,
  };
}
