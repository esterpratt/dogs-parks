import { Park } from './types/park';

const mockParks: Park[] = [
  {
    id: '1',
    location: {
      latitude: 32.06360061588246,
      longitude: 34.807096644613864,
    },
    name: 'Sold',
    city: 'Givatayim',
    address: 'Eilat 8',
  },
  {
    id: '2',
    location: {
      latitude: 32.068804440354604,
      longitude: 34.806206960627314,
    },
    name: 'Heil Haavir',
    city: 'Givatayim',
    address: 'Metzulot Yam',
  },
];

export { mockParks };
