enum FRIENDS_KEY {
  FRIENDS = 'FRIENDS',
  PENDING_FRIENDS = 'PENDING_FRIENDS',
  MY_PENDING_FRIENDS = 'MY_PENDING_FRIENDS',
}

// Park-related query keys for hybrid caching strategy
const getParksJSONKey = (language: string) => ['parks', language];
const getParkWithTranslationKey = (parkId: string, language: string) => [
  'park',
  parkId,
  language,
];

// Exposed key functions for external use
const parksKey = (language: string) => ['parks', language];
const parkKey = (parkId: string, language: string) => ['park', parkId, language];

const getFriendshipMapKey = (userId?: string | null) => [
  'friendshipMap',
  userId,
];

export {
  FRIENDS_KEY,
  getFriendshipMapKey,
  getParksJSONKey,
  getParkWithTranslationKey,
  parksKey,
  parkKey,
};
