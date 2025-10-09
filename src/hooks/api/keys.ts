enum FRIENDS_KEY {
  FRIENDS = 'FRIENDS',
  PENDING_FRIENDS = 'PENDING_FRIENDS',
  MY_PENDING_FRIENDS = 'MY_PENDING_FRIENDS',
}

const getParksJSONKey = (language: string) => ['parks', language];
const getParkWithTranslationKey = (parkId: string, language: string) => [
  'park',
  parkId,
  language,
];

const parksKey = (language: string) => ['parks', language];
const parkKey = (parkId: string, language: string) => [
  'park',
  parkId,
  language,
];

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
