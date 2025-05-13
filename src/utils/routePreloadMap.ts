export const routePreloadMap: Record<string, () => Promise<{ default: React.ComponentType<JSX.IntrinsicAttributes> }>> = {
  profile: () => import('../pages/Profile'),
  park: () => import('../pages/Park'),
  dog: () => import('../pages/UserDog'),
  userFriends: () => import('../pages/UserFriends'),
  userFavorites: () => import('../pages/UserFavorites'),
  userReviews: () => import('../pages/UserReviews'),
  userInfo: () => import('../pages/UserInfo'),
  parkReviews: () => import('../pages/ParkReviews'),
  parkVisitors: () => import('../pages/ParkVisitors'),
};