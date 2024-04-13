// TODO: decide later how to type this (also typed in 'park.ts' in types directory)
enum ParkMaterial {
  GARSS = 'grass',
  SAND = 'sand',
}

const parks = [
  {
    id: '1',
    city: 'Givatayim',
    name: 'Givatayim Park',
    address: 'Yitzhak Rabin 53',
    location: {
      lat: 32.066698,
      lng: 34.811341,
    },
    size: 40,

    materials: [ParkMaterial.GARSS, ParkMaterial.SAND],
    hasShade: true,
    hasWater: true,
    hasFacilities: false,
  },
  {
    id: '2',
    city: 'Givatayim',
    name: 'Sold',
    address: 'Eilat 8',
    location: {
      lat: 32.068804440354604,
      lng: 34.806206960627314,
    },
    size: 25,

    materials: [ParkMaterial.SAND],
    hasShade: true,
    hasWater: true,
    hasFacilities: false,
  },
  {
    id: '3',
    city: 'Givatayim',
    name: 'Heil Haavir',
    address: 'Metzulot Yam',
    location: {
      lat: 32.06360061588246,
      lng: 34.807096644613864,
    },
    size: 30,

    materials: [ParkMaterial.GARSS],
    hasShade: true,
    hasWater: true,
    hasFacilities: false,
  },
];

export { parks };
