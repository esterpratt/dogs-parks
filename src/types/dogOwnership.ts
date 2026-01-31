enum DogMemberRole {
  PRIMARY_OWNER = 'PRIMARY_OWNER',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

enum DogInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELED = 'CANCELED',
}

interface DogMember {
  dog_id: string;
  user_id: string;
  role: DogMemberRole;
  created_at: string;
  user?: {
    id: string;
    name: string | null;
  };
}

interface DogInvite {
  id: string;
  dog_id: string;
  inviter_user_id: string;
  invitee_user_id: string;
  role_offered: DogMemberRole;
  is_primary_transfer: boolean;
  status: DogInviteStatus;
  created_at: string;
  responded_at: string | null;
  inviter?: {
    id: string;
    name: string | null;
  };
  invitee?: {
    id: string;
    name: string | null;
  };
}

type DogImageBucket = 'dogs' | 'users';

interface DogImage {
  id: string;
  dog_id: string;
  bucket_id: DogImageBucket;
  storage_path: string;
  is_primary: boolean;
  created_at: string;
  url?: string;
}

interface UserDogRow {
  user_id: string;
  role: DogMemberRole;
  dog: Dog | null;
}

export type {
  DogImage,
  DogInvite,
  DogMember,
  DogImageBucket,
  UserDogRow,
};
export { DogInviteStatus, DogMemberRole };
import { Dog } from './dog';
