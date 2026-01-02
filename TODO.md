# TODO List - Critic Newsfeed

## High Priority Issues

### 🔴 Filtering & Performance Issues
- **Strange tag fetching requests during filtering** - Investigate why filtering posts triggers unexpected tag fetch requests
- **Add refresh button for posts** - Implement refresh functionality that fetches new posts by checking date (avoid refetching existing posts)
- **Tag filtering optimization** - When filtering by tags, refetch posts from server with date-based optimization instead of client-side filtering

## Completed Optimizations ✅
- ✅ **Components make extra requests** - Eliminated duplicate API calls and implemented proper store-based architecture
- ✅ **Optimize profile page loading** - Improved loading performance with store-based data management
- ✅ **Fix followers count display** - Resolved follower count issues with optimized fetching
- ✅ **Store clearing on sign out** - Clear all stores and cache when user signs out
- ✅ **Store reinitialization on sign in** - Load initial data when user signs in
- ✅ **Profile page redundant requests** - Eliminated duplicate API calls between ProfileComponent and ProfileHeaderComponent
- ✅ **Separated profile and follow data loading** - Optimized data loading flow to minimize HTTP requests
- ✅ **Route all profile updates through store** - Centralized profile state management
- ✅ **Fix profile updates not showing in all places** - Real-time profile updates across all components
- ✅ **Fix navigation persistence issues** - Profile changes persist across page navigation
- ✅ **Fix aside panel sync issues** - User-info component always shows current user's profile
- ✅ **Fix duplicate posts loading** - Eliminated duplicate API calls for posts
- ✅ **Overall app cleanup** - Removed unused methods and dead code
- ✅ **Optimize tag fetching** - Implemented GIN index-optimized query for unique tags

## Technical Debt
- Review and optimize Supabase queries for better performance
- Implement proper error handling for failed API requests
- Add loading states for better UX during data fetching

## Future Enhancements
- Implement real-time updates for follower counts
- Add caching layer for frequently accessed data
- Optimize bundle size and lazy loading
