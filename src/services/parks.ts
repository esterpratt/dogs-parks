import { Park } from '../types/park';
// import { fetchImagesByDirectory, uploadImage } from './image';
import { throwError } from './error';
import { supabase } from './supabase-client';
import { getJsonFileUrl } from './supabase-storage';

const fetchParksJSON = async () => {
  try {
    const url = await getJsonFileUrl({bucketName: 'parks', fileName: 'parks.json'});
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch parks file');
    const parks = await response.json();
    return parks as Park[];
  } catch (error) {
    throwError(error);
  }
};

const fetchPark = async (parkId: string) => {
  try {
    const { data: park, error } = await supabase
    .from('parks')
    .select('*')
    .eq('id', parkId)
    .single();

    if (error) {
      throw error;
    }

    return park;
  } catch (error) {
    throwError(error);
  }
};

const updatePark = async (parkId: string, parkDetails: Partial<Park>) => {
  try {
    const { error } = await supabase
    .from('parks')
    .update({
      size: parkDetails.size,
      materials: parkDetails.materials,
      shade: parkDetails.shade,
      has_water: parkDetails.has_water,
      has_facilities: parkDetails.has_facilities
    })
    .eq('id', parkId)

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`there was an error while updating park ${parkId}: ${JSON.stringify(error)}`);
  }
};

const uploadParkImage = async (image: File | string, parkId: string) => {
  try {
    // TODO: upload park image

    // const res = await uploadImage({ image, path: `parks/${parkId}/other` });
    // return res;
  } catch (error) {
    throwError(error);
  }
};

const uploadParkPrimaryImage = async (image: File | string, parkId: string) => {
  try {
    // TODO: upload park primary image

    // const res = await uploadImage({
    //   image,
    //   path: `parks/${parkId}/primary`,
    //   name: 'primaryImage',
    // });
    // return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchParkPrimaryImage = async (parkId: string) => {
  try {
    // TODO: fetch park primary image

    // const res = await fetchImagesByDirectory(`parks/${parkId}/primary`);
    // return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchAllParkImages = async (parkId: string) => {
  try {
    // TODO: fetch park images

    // const res = await fetchImagesByDirectory(`parks/${parkId}/other`);
    // return res;
  } catch (error) {
    throwError(error);
  }
};

export {
  fetchPark,
  fetchParksJSON,
  uploadParkImage,
  uploadParkPrimaryImage,
  fetchParkPrimaryImage,
  fetchAllParkImages,
  updatePark,
};
