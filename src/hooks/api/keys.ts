enum FRIENDS_KEY {
  FRIENDS = 'FRIENDS',
  PENDING_FRIENDS = 'PENDING_FRIENDS',
  MY_PENDING_FRIENDS = 'MY_PENDING_FRIENDS',
}

const getFriendshipMapKey = (userId?: string | null) => ['friendshipMap', userId]

export { FRIENDS_KEY, getFriendshipMapKey };
