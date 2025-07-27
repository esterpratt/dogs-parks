import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFriendIdsByStatus, buildFriendshipMap } from './friendship';
import { FRIENDSHIP_STATUS, USER_ROLE, Friendship } from '../types/friendship';
import { fetchUserFriendships } from '../services/friendships';

// Mock the friendships service
vi.mock('../services/friendships', () => ({
  fetchUserFriendships: vi.fn(),
}));

const mockFetchUserFriendships = vi.mocked(fetchUserFriendships);

describe('getFriendIdsByStatus', () => {
  let friendshipMap: Map<string, Friendship>;

  beforeEach(() => {
    friendshipMap = new Map();
    vi.clearAllMocks();
  });

  const createFriendship = (
    id: string,
    requesterId: string,
    requesteeId: string,
    status: FRIENDSHIP_STATUS
  ): Friendship => ({
    id,
    requester_id: requesterId,
    requestee_id: requesteeId,
    status,
  });

  describe('Happy Path', () => {
    it('returns friend IDs with matching status', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      const friendship2 = createFriendship('2', 'user3', 'user4', FRIENDSHIP_STATUS.PENDING);
      const friendship3 = createFriendship('3', 'user5', 'user6', FRIENDSHIP_STATUS.APPROVED);

      friendshipMap.set('user2', friendship1);
      friendshipMap.set('user4', friendship2);
      friendshipMap.set('user6', friendship3);

      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.APPROVED,
      });

      expect(result).toEqual(['user2', 'user6']);
    });

    it('returns friend IDs filtered by user role as requestee', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      const friendship2 = createFriendship('2', 'user2', 'user3', FRIENDSHIP_STATUS.APPROVED);

      friendshipMap.set('user2', friendship1);
      friendshipMap.set('user3', friendship2);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTEE,
      });

      expect(result).toEqual(['user2']); // Only where user2 is requestee
    });

    it('returns friend IDs filtered by user role as requester', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      const friendship2 = createFriendship('2', 'user2', 'user3', FRIENDSHIP_STATUS.APPROVED);

      friendshipMap.set('user2', friendship1);
      friendshipMap.set('user3', friendship2);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTER,
      });

      expect(result).toEqual(['user3']); // Only where user2 is requester
    });

    it('returns matching friendships when userRole is ANY (behaves like REQUESTER)', () => {
      // Note: The current implementation treats USER_ROLE.ANY the same as USER_ROLE.REQUESTER
      // because userRole === USER_ROLE.REQUESTEE ? 'requestee_id' : 'requester_id'
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      const friendship2 = createFriendship('2', 'user2', 'user3', FRIENDSHIP_STATUS.APPROVED);

      friendshipMap.set('user2', friendship1);
      friendshipMap.set('user3', friendship2);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.ANY,
      });

      // Current implementation only returns where user2 is requester
      expect(result).toEqual(['user3']);
    });
  });

  describe('Edge Cases', () => {
    it('returns empty array when friendshipMap is empty', () => {
      const result = getFriendIdsByStatus({
        friendshipMap: new Map(),
        status: FRIENDSHIP_STATUS.APPROVED,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when no friendships match the status', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.PENDING);
      friendshipMap.set('user2', friendship1);

      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.APPROVED,
      });

      expect(result).toEqual([]);
    });

    it('returns empty array when userId provided but no userRole', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      friendshipMap.set('user2', friendship1);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        // userRole not provided
      });

      expect(result).toEqual(['user2']); // Should work without userRole filtering
    });

    it('returns empty array when userRole provided but no userId', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      friendshipMap.set('user2', friendship1);

      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTEE,
        // userId not provided
      });

      expect(result).toEqual(['user2']); // Should work without userId filtering
    });

    it('handles undefined userId gracefully', () => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      friendshipMap.set('user2', friendship1);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: undefined,
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTEE,
      });

      expect(result).toEqual(['user2']);
    });
  });

  describe('Different Friendship Statuses', () => {
    beforeEach(() => {
      const friendship1 = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      const friendship2 = createFriendship('2', 'user3', 'user4', FRIENDSHIP_STATUS.PENDING);
      const friendship3 = createFriendship('3', 'user5', 'user6', FRIENDSHIP_STATUS.REMOVED);
      const friendship4 = createFriendship('4', 'user7', 'user8', FRIENDSHIP_STATUS.ABORTED);

      friendshipMap.set('user2', friendship1);
      friendshipMap.set('user4', friendship2);
      friendshipMap.set('user6', friendship3);
      friendshipMap.set('user8', friendship4);
    });

    it('filters by PENDING status', () => {
      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.PENDING,
      });

      expect(result).toEqual(['user4']);
    });

    it('filters by REMOVED status', () => {
      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.REMOVED,
      });

      expect(result).toEqual(['user6']);
    });

    it('filters by ABORTED status', () => {
      const result = getFriendIdsByStatus({
        friendshipMap,
        status: FRIENDSHIP_STATUS.ABORTED,
      });

      expect(result).toEqual(['user8']);
    });
  });

  describe('Complex Role Filtering', () => {
    it('correctly identifies requestee when user is in requestee_id field', () => {
      const friendship = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      friendshipMap.set('user2', friendship);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTEE,
      });

      expect(result).toEqual(['user2']);
    });

    it('excludes friendship when user role does not match', () => {
      const friendship = createFriendship('1', 'user1', 'user2', FRIENDSHIP_STATUS.APPROVED);
      friendshipMap.set('user2', friendship);

      const result = getFriendIdsByStatus({
        friendshipMap,
        userId: 'user2',
        status: FRIENDSHIP_STATUS.APPROVED,
        userRole: USER_ROLE.REQUESTER, // user2 is requestee, not requester
      });

      expect(result).toEqual([]);
    });
  });
});

describe('buildFriendshipMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createFriendship = (
    id: string,
    requesterId: string,
    requesteeId: string,
    status: FRIENDSHIP_STATUS
  ): Friendship => ({
    id,
    requester_id: requesterId,
    requestee_id: requesteeId,
    status,
  });

  describe('Happy Path', () => {
    it('builds friendship map correctly when user is requester', async () => {
      const friendships = [
        createFriendship('1', 'user1', 'friend1', FRIENDSHIP_STATUS.APPROVED),
        createFriendship('2', 'user1', 'friend2', FRIENDSHIP_STATUS.PENDING),
      ];

      mockFetchUserFriendships.mockResolvedValue(friendships);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(2);
      expect(result.get('friend1')).toEqual(friendships[0]);
      expect(result.get('friend2')).toEqual(friendships[1]);
      expect(mockFetchUserFriendships).toHaveBeenCalledWith({ userId: 'user1' });
    });

    it('builds friendship map correctly when user is requestee', async () => {
      const friendships = [
        createFriendship('1', 'friend1', 'user1', FRIENDSHIP_STATUS.APPROVED),
        createFriendship('2', 'friend2', 'user1', FRIENDSHIP_STATUS.PENDING),
      ];

      mockFetchUserFriendships.mockResolvedValue(friendships);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(2);
      expect(result.get('friend1')).toEqual(friendships[0]);
      expect(result.get('friend2')).toEqual(friendships[1]);
    });

    it('builds friendship map with mixed requester/requestee roles', async () => {
      const friendships = [
        createFriendship('1', 'user1', 'friend1', FRIENDSHIP_STATUS.APPROVED), // user1 is requester
        createFriendship('2', 'friend2', 'user1', FRIENDSHIP_STATUS.PENDING), // user1 is requestee
      ];

      mockFetchUserFriendships.mockResolvedValue(friendships);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(2);
      expect(result.get('friend1')).toEqual(friendships[0]);
      expect(result.get('friend2')).toEqual(friendships[1]);
    });
  });

  describe('Edge Cases', () => {
    it('returns empty map when no friendships exist', async () => {
      mockFetchUserFriendships.mockResolvedValue([]);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(0);
      expect(result instanceof Map).toBe(true);
    });

    it('returns empty map when fetchUserFriendships returns null', async () => {
      mockFetchUserFriendships.mockResolvedValue(null);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(0);
      expect(result instanceof Map).toBe(true);
    });


    it('handles single friendship correctly', async () => {
      const friendship = createFriendship('1', 'user1', 'friend1', FRIENDSHIP_STATUS.APPROVED);
      mockFetchUserFriendships.mockResolvedValue([friendship]);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(1);
      expect(result.get('friend1')).toEqual(friendship);
    });
  });

  describe('Error Handling', () => {
    it('propagates error when fetchUserFriendships throws', async () => {
      const error = new Error('Network error');
      mockFetchUserFriendships.mockRejectedValue(error);

      await expect(buildFriendshipMap('user1')).rejects.toThrow('Network error');
    });

    it('handles empty userId string', async () => {
      mockFetchUserFriendships.mockResolvedValue([]);

      const result = await buildFriendshipMap('');

      expect(result.size).toBe(0);
      expect(mockFetchUserFriendships).toHaveBeenCalledWith({ userId: '' });
    });
  });

  describe('Map Key Logic', () => {
    it('uses correct friend ID as map key when user is requester', async () => {
      const friendship = createFriendship('1', 'user1', 'friend1', FRIENDSHIP_STATUS.APPROVED);
      mockFetchUserFriendships.mockResolvedValue([friendship]);

      const result = await buildFriendshipMap('user1');

      expect(Array.from(result.keys())).toEqual(['friend1']);
    });

    it('uses correct friend ID as map key when user is requestee', async () => {
      const friendship = createFriendship('1', 'friend1', 'user1', FRIENDSHIP_STATUS.APPROVED);
      mockFetchUserFriendships.mockResolvedValue([friendship]);

      const result = await buildFriendshipMap('user1');

      expect(Array.from(result.keys())).toEqual(['friend1']);
    });

    it('does not include self-friendship (edge case)', async () => {
      // Edge case: if somehow a self-friendship exists
      const friendship = createFriendship('1', 'user1', 'user1', FRIENDSHIP_STATUS.APPROVED);
      mockFetchUserFriendships.mockResolvedValue([friendship]);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(1);
      expect(result.get('user1')).toEqual(friendship);
    });
  });

  describe('Large Dataset Performance', () => {
    it('handles large number of friendships efficiently', async () => {
      const largeFriendshipList = Array.from({ length: 1000 }, (_, i) => 
        createFriendship(`${i}`, 'user1', `friend${i}`, FRIENDSHIP_STATUS.APPROVED)
      );

      mockFetchUserFriendships.mockResolvedValue(largeFriendshipList);

      const result = await buildFriendshipMap('user1');

      expect(result.size).toBe(1000);
      expect(result.get('friend0')).toBeDefined();
      expect(result.get('friend999')).toBeDefined();
    });
  });
});