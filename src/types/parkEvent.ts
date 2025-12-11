enum ParkEventVisibility {
  FRIENDS_ALL = 'FRIENDS_ALL',
  FRIENDS_SELECTED = 'FRIENDS_SELECTED',
}
enum ParkEventStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
}

enum ParkEventInviteeStatus {
  INVITED = 'INVITED',
  DECLINED = 'DECLINED',
  REMOVED = 'REMOVED',
  ACCEPTED = 'ACCEPTED',
}

interface ParkEventBase {
  id: string;
  park_id: string;
  start_at: string;
  end_at: string;
  status: ParkEventStatus;
  message?: string;
  duration_minutes: number;
}

interface ParkEvent extends ParkEventBase {
  creator_name?: string;
  creator_id: string;
}

interface ParkEventInvite extends ParkEventBase {
  my_invite_added_by: string;
  my_invite_added_by_name: string;
  my_invite_responded_at: string;
  my_invite_status: ParkEventInviteeStatus;
}

interface Invitee {
  user_id: string;
  name: string;
  status: ParkEventInviteeStatus;
  responded_at: string;
  added_at: string;
  added_by: string;
}

interface EventConflictSlot {
  id: string;
  parkId: string;
  type: 'organized' | 'invited';
  startMs: number;
  endMs: number;
}

export { ParkEventVisibility, ParkEventStatus, ParkEventInviteeStatus };
export type {
  ParkEventBase,
  ParkEventInvite,
  Invitee,
  ParkEvent,
  EventConflictSlot,
};
