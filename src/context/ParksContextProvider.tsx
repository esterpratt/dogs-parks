import { PropsWithChildren, createContext, useEffect, useState } from 'react';
// import { db } from '../firebase-config';
// import { getDocs, collection } from 'firebase/firestore';
import { mockParks } from '../mockParks';
import { Park } from '../types/park';

interface ParksContextObj {
  parks: Park[];
}

const initialData: ParksContextObj = {
  parks: [],
};

const ParksContext = createContext<ParksContextObj>(initialData);

const ParksContextProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [parks, setParks] = useState<Park[]>([]);
  // const parksCollection = collection(db, 'parks');

  useEffect(
    () => {
      const getParks = async () => {
        // const data = await getDocs(parksCollection);
        // const parks = data.docs.map((doc) => {
        //   return {
        //     ...doc.data(),
        //     id: doc.id,
        //     location: doc.data().location.toJSON(),
        //   };
        // }) as Park[];
        setParks(mockParks);
      };

      getParks();
    },
    [
      /*parksCollection*/
    ]
  );

  const value: ParksContextObj = {
    parks,
  };

  return (
    <ParksContext.Provider value={value}>{children}</ParksContext.Provider>
  );
};

export { ParksContextProvider, ParksContext };
