interface Checkin {
  id: string;
  park_id: string;
  user_id?: string;
  checkin_timestamp: Date;
  checkout_timestamp?: Date;
}

export type { Checkin };
