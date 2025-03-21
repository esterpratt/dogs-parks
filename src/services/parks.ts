import { Park } from '../types/park';
import { throwError } from './error';
import { fetchImagesByDirectory, uploadImage } from './image';
import { supabase } from './supabase-client';
import { getFileUrl } from './supabase-storage';

const fetchParksJSON = async () => {
  try {
    const url = await getFileUrl({bucketName: 'parks', fileName: 'parks.json'});
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
      const res = await uploadImage({
        image,
        path: `${parkId}/other/`,
        bucket: 'parks',
      });
      return res;
    } catch (error) {
      throwError(error);
    }
};

const uploadParkPrimaryImage = async (image: File | string, parkId: string) => {
  try {
    const res = await uploadImage({
      image,
      bucket: 'parks',
      path: `${parkId}/primary/`,
      name: 'primary'
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchParkPrimaryImage = async (parkId: string) => {
  try {
      const res = await fetchImagesByDirectory({bucket: 'parks', path: `${parkId}/primary/`});
      return res?.[0];
    } catch (error) {
      console.error(
        `there was a problem fetching primary image for park ${parkId}: ${JSON.stringify(error)}`
      );
      return null;
    }
};

const fetchAllParkImages = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory({bucket: 'parks', path: `${parkId}/other/`});
    return res;
  } catch (error) {
    console.error(
        `there was a problem fetching images for park ${parkId}: ${JSON.stringify(error)}`
      );
      return null;
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
