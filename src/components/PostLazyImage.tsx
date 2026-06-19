import React, { useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface PostLazyImageProps {
  postId: string;
  className?: string;
  fallback?: React.ReactNode;
}

export const PostLazyImage: React.FC<PostLazyImageProps> = ({
  postId,
  className = "w-full h-full object-cover",
  fallback
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setHasError(false);
    
    const fetchImage = async () => {
      try {
        setLoading(true);
        const img = await supabaseService.getPostImage(postId);
        if (active) {
          setImageUrl(img || null);
        }
      } catch (err) {
        console.warn('Error loading lazy post image for:', postId, err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchImage();

    return () => {
      active = false;
    };
  }, [postId]);

  if (loading) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center min-h-[40px]">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!imageUrl || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
};
