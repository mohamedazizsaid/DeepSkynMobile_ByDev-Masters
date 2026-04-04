// ─── Post / Community Types ───
export interface Post {
  id: string;
  userId: string;
  media: string | null;
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: { id?: string; name: string; avatar: string | null };
  _count?: { likes: number; comments: number };
  isLiked?: boolean;
  reaction?: string | null;
  reactionSummary?: Record<string, number>;
}

export interface CreatePostDto {
  message: string;
  media?: string;
}

export interface Comment {
  id: string;
  userId: string;
  postId?: string;
  parentId?: string;
  comment: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
  user?: { id?: string; name: string; avatar: string | null };
  isLiked?: boolean;
  _count?: { likes: number };
}

export interface CreateCommentDto {
  postId: string;
  comment: string;
}
