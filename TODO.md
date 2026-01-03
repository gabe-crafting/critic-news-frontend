# TODO List - Critic Newsfeed

## 🚀 Features

### 🔄 Core Functionality
- **Add refresh button for posts** - Implement refresh functionality that fetches new posts by checking date (avoid refetching existing posts)
- **Tag filtering optimization** - When filtering by tags, refetch posts from server with date-based optimization instead of client-side filtering
- **Add archived link parameter to posts** - Add a new parameter on posts for archived links with automatic archiving option
- **Download filtered posts** - Add button to download all filtered posts in a table format with description, link, and archived_link
- **Preview user functionality** - Add ability to preview user profiles and content
- **Real-time follower count updates** - Implement live updates for follower counts across the app

### 🎨 User Experience
- **Caching layer** - Add caching for frequently accessed data to improve performance
- **Bundle size optimization** - Optimize bundle size and implement lazy loading
- **Loading states** - Add proper loading states for better UX during data fetching

## 🔒 Legal & Security

### 🛡️ Content Moderation
- **Content filtering service** - Integrate service to check posted links for pornographic, gambling, or spam content before allowing posts
- **Ban user functionality** - Add administrative capability to ban users who violate terms

### 📜 Compliance
- **Terms and services page** - Add terms and services page accessible from the main page

## 🛠️ Technical Debt
- Review and optimize Supabase queries for better performance
- Implement proper error handling for failed API requests

## ✅ Completed Optimizations
- ✅ **Strange tag fetching requests during filtering** - Optimized tag tracking to use local profile data instead of unnecessary API calls
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
