export const routePreloadMap: Record<string, () => Promise<{ default: React.ComponentType<JSX.IntrinsicAttributes> }>> = {
  profile: () => import('../pages/Profile'),
  park: () => import('../pages/Park'),
  dog: () => import('../pages/UserDog'),
};