export const routePreloadMap: Record<
  string,
  () => Promise<{ default: React.ComponentType<JSX.IntrinsicAttributes> }>
> = {
  profile: () => import('../pages/Profile'),
  park: () => import('../pages/Park'),
  parks: () => import('../pages/Parks'),
  users: () => import('../pages/Users'),
  dog: () => import('../pages/UserDog'),
  userFriends: () => import('../pages/UserFriends'),
  userFavorites: () => import('../pages/UserFavorites'),
  userReviews: () => import('../pages/UserReviews'),
  userEvents: () => import('../pages/UserEvents'),
  userSettings: () => import('../pages/Settings'),
  parkReviews: () => import('../pages/ParkReviews'),
  parkVisitors: () => import('../pages/ParkVisitors'),
};
