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
  event_id: string;
  park_id: string;
  start_at: string;
  end_at: string;
  status: ParkEventStatus;
  message?: string;
}

interface ParkEventInvite extends ParkEventBase {
  my_invite_added_by: string;
  my_invite_added_by_name: string;
  my_invite_responded_at: string;
  my_invite_status: ParkEventInviteeStatus;
}

export { ParkEventVisibility, ParkEventStatus, ParkEventInviteeStatus };
export type { ParkEventBase, ParkEventInvite };
