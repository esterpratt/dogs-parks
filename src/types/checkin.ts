interface Checkin {
  id: string;
  parkId: string;
  userId?: string;
  checkinTimestamp: Date;
  checkoutTimestamp?: Date;
}

export type { Checkin };
