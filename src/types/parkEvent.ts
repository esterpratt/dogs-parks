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

export { ParkEventVisibility, ParkEventStatus, ParkEventInviteeStatus };
