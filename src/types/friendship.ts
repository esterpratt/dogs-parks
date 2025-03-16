import { User } from './user';

interface Friendship {
  id: string;
  requester_id: User['id'];
  requestee_id: User['id'];
  status: FRIENDSHIP_STATUS;
}

enum FRIENDSHIP_STATUS {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  REMOVED = 'REMOVED',
  ABORTED = 'ABORTED',
}

enum USER_ROLE {
  REQUESTEE = 'REQUESTEE',
  REQUESTER = 'REQUESTER',
  ANY = 'ANY',
}

export { FRIENDSHIP_STATUS, USER_ROLE };
export type { Friendship };
