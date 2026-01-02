# TODO List - Critic Newsfeed

## High Priority Issues

### 🔴 Profile Page Optimizations
- **Components make requests on refresh** - Implement proper caching and state persistence to avoid unnecessary API calls when page refreshes
- **Optimize profile page loading** - Improve loading performance and data fetching efficiency
- **Fix followers count display** - Figure out why follower count shows 0 instead of actual count (user has 2 followers) and optimize the fetching process

## Completed Optimizations
- ✅ **Store clearing on sign out** - Clear all stores and cache when user signs out
- ✅ **Store reinitialization on sign in** - Load initial data when user signs in
- ✅ **Profile page redundant requests** - Eliminated duplicate API calls between ProfileComponent and ProfileHeaderComponent
- ✅ **Separated profile and follow data loading** - Optimized data loading flow to minimize HTTP requests

## Technical Debt
- Review and optimize Supabase queries for better performance
- Implement proper error handling for failed API requests
- Add loading states for better UX during data fetching

## Future Enhancements
- Implement real-time updates for follower counts
- Add caching layer for frequently accessed data
- Optimize bundle size and lazy loading
