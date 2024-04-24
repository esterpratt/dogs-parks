import { User } from './user';

interface Friendship {
  id: string;
  requesterId: User['id'];
  requesteeId: User['id'];
  status: FRIENDSHIP_STATUS;
}

enum FRIENDSHIP_STATUS {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REJECTED = 'REJECTED',
  ABORTED = 'ABORTED',
}

export { FRIENDSHIP_STATUS };
export type { Friendship };
