interface User {
  id: string;
  name?: string;
  dogId?: string;
  friends?: User['id'][];
}

export type { User };
