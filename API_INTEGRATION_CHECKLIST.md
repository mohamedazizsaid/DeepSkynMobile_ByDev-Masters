# API Integration Checklist - Community Features

## 🔗 API Endpoints À Vérifier/Implémenter

### Posts Management

#### ✅ Existants (Vérifiés)
```typescript
// Get feed posts
postsService.getFeed(pageNum: number, limit: number)
  Returns: { data: Post[], hasMore: boolean }

// Get user's own posts
postsService.getMyPosts(pageNum: number, limit: number)
  Returns: { data: Post[], hasMore: boolean }

// Create new post
postsService.create({ message: string, media?: string })
  Returns: Post

// Toggle like on post
postsService.toggleLike(postId: string)
  Returns: { liked: boolean, likesCount: number, type: string }
```

#### ❓ À Vérifier/Implémenter

**Archives** (NOUVEAU)
```typescript
// Get archived posts
postsService.getArchivedPosts(pageNum: number, limit: number): Promise<{ data: Post[] }>
// → Utilisé dans: CommunityScreen.tsx (archive tab)
// → Doit retourner les posts archivés de l'utilisateur actuel

// Archive a post
postsService.archivePost(postId: string, isArchived: boolean): Promise<void>
// → Archive/unarchive un post

// Delete a post (soft delete)
postsService.deletePost(postId: string): Promise<void>
// → Supprime un post (optionnel, menu existe pour ça)
```

---

### Comments Management

#### ✅ Existants (Vérifiés)
```typescript
// Get comments for a post
postsService.getComments(postId: string)
  Returns: { data: Comment[] }

// Add comment to post
postsService.addComment({ 
  postId: string, 
  comment: string,
  parentId?: string  // for replies
})
  Returns: Comment

// Delete comment
postsService.deleteComment(commentId: string)
  Returns: void

// Toggle like on comment
postsService.toggleCommentLike(commentId: string)
  Returns: { liked: boolean }
```

#### Status
- ✅ Tous les commentaires posts intégrés
- Répliques/nested comments: Structure prête

---

### Stories Management

#### ✅ Existant (Partiellement)
```typescript
// Get active stories
postsService.getActiveStories()
  Returns: Story[]

// Get free music for stories
postsService.getFreeMusicForStories()
  Returns: { title: string, url: string }[]
```

#### ❓ À Implémenter (NOUVEAU)

**Story CRUD**
```typescript
// Create story with optional music
postsService.createStory(
  mediaBase64: string,
  userId: string,
  musicBase64?: string,
  musicTitle?: string
): Promise<Story>

// Get comments on a story
postsService.getStoryComments(storyId: string): Promise<{ data: StoryComment[] }>

// Add comment to story
postsService.addStoryComment(
  storyId: string,
  comment: string
): Promise<StoryComment>

// Delete story comment
postsService.deleteStoryComment(commentId: string): Promise<void>

// Toggle like on story
postsService.toggleStoryLike(storyId: string): Promise<{ 
  liked: boolean, 
  likesCount: number 
}>

// Toggle like on story comment
postsService.toggleStoryCommentLike(commentId: string): Promise<{ 
  liked: boolean 
}>

// Delete story
postsService.deleteStory(storyId: string): Promise<void>
```

**Story Statistics**
```typescript
// Get story views and engagement
postsService.getStoryStats(storyId: string): Promise<{
  views: number,
  likes: number,
  comments: number,
  shares: number
}>
```

---

### User Stats & Following

#### ❓ À Vérifier/Implémenter

**User Stats** (NOUVEAU)
```typescript
// Get user statistics
usersService.getUserStats(userId: string): Promise<{
  posts: number,
  followers: number,
  following: number,
  totalLikes: number,
  totalComments: number,
  weeklyActivity: number[],  // 7 jours
  storyViews: number,
  impressions: number,
  shares: number,
  recentFollowersAvatars: string[],
  followersDetail: User[]
}>

// Get suggestions
usersService.getSuggestions(): Promise<User[]>

// Follow/Unfollow user
usersService.toggleFollow(userId: string): Promise<{ following: boolean }>
```

---

## 📝 Type Definitions À Vérifier

```typescript
interface Post {
  id: string;
  message: string;
  media?: string;  // NEW
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  isLiked?: boolean;
  reaction?: string;
  _count?: {
    likes: number;
    comments: number;
  };
}

interface Comment {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  parentId?: string;  // for nested comments
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  isLiked?: boolean;  // NEW - for comment likes
  _count?: {
    likes: number;  // NEW
  };
}

interface Story {
  id: string;
  mediaUrl: string;
  createdAt?: string;
  userId: string;
  musicUrl?: string;
  musicTitle?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

interface StoryComment {
  id: string;
  message: string;
  createdAt: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  isLiked?: boolean;
  _count?: {
    likes: number;
  };
}

interface CommunityStats {
  posts: number;
  followers: number;
  following: number;
  totalLikes: number;
  totalComments: number;
  weeklyActivity: number[];
  storyViews: number;
  impressions: number;
  shares: number;
  recentFollowersAvatars: string[];
  followersDetail: User[];
}
```

---

## 🧪 Testing Checklist

### Posts & Media
- [ ] Create post with text only
- [ ] Create post with media
- [ ] Delete media from composer
- [ ] Remove media preview
- [ ] Like post → counter increases
- [ ] Unlike post → counter decreases
- [ ] Edit post (if supported)

### Comments
- [ ] Open comments modal
- [ ] Add comment → appears in list
- [ ] Like comment → counter updates
- [ ] Unlike comment → counter decreases
- [ ] Delete own comment → removed
- [ ] Try delete other's comment → disabled

### Stories
- [ ] Upload story (image)
- [ ] Upload story (video)
- [ ] Upload story + music
- [ ] Remove music
- [ ] View story fullscreen
- [ ] Progress bars work
- [ ] Navigate prev/next
- [ ] Like story → animation + counter
- [ ] Add comment to story
- [ ] Like story comment
- [ ] Delete own story comment

### Archives
- [ ] Archive post → appears in archives tab
- [ ] Unarchive post → back to feed
- [ ] Load archived posts
- [ ] Empty state shows correctly

### Stats
- [ ] KPI values display
- [ ] Trends show arrows
- [ ] Weekly chart renders
- [ ] Engagement metrics align
- [ ] Story stats list loads

### Accessibility
- [ ] All buttons have labels
- [ ] Keyboard navigation works
- [ ] Screen reader announces content
- [ ] Contrast ratio sufficient
- [ ] Touch targets ≥44x44

### Translations
- [ ] All text in target language
- [ ] No missing translation keys
- [ ] Special chars display correctly
- [ ] RTL layout (if applicable)

---

## 🚀 Implementation Priority

### Phase 1 (Critical)
1. ✅ Posts CRUD (create, read, like)
2. ✅ Comments on posts (add, delete, like)
3. ✅ Stories basic (upload, view)

### Phase 2 (High)
1. Story comments & likes
2. Archives functionality
3. User stats/following

### Phase 3 (Enhancement)
1. Story music upload
2. Nested comments/replies
3. Story highlights
4. Advanced analytics

---

## 📚 Backend References

### Endpoints Pattern
```
/api/posts
  GET    /          → Feed
  GET    /my        → User's posts
  GET    /archived  → Archived posts
  POST   /          → Create post
  DELETE /:id       → Delete post
  PATCH  /:id/archive → Toggle archive

/api/stories
  GET    /          → Active stories
  GET    /free-music → Free music tracks
  POST   /          → Create story
  DELETE /:id       → Delete story

/api/comments
  GET    /posts/:postId      → Posts comments
  GET    /stories/:storyId   → Story comments
  POST   /posts/:postId      → Add post comment
  POST   /stories/:storyId   → Add story comment
  DELETE /:id                → Delete comment
  POST   /:id/like           → Toggle like

/api/users
  GET    /:id/stats      → User statistics
  GET    /suggestions    → Suggestions
  POST   /:id/follow     → Follow/unfollow
```

---

## 💡 Notes

- All APIs should support pagination (skip, take) for large datasets
- Implement error handling & retry logic in mobile UI
- Consider caching for user stats (24h cache)
- Music upload may need pre-processing (FFmpeg, etc.)
- Archive should be soft-delete (preserve data)
- Comments likes should track per-user (not global)

