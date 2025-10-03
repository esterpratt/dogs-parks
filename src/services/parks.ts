import { Park, ParkJSON, RawParkData, TranslatedPark } from '../types/park';
import type { AppLanguage } from '../types/language';
import { APP_LANGUAGES } from '../utils/consts';
import { throwError } from './error';
import { fetchImagesByDirectory, uploadImage } from './image';
import { supabase } from './supabase-client';
import { getFileUrl } from './supabase-storage';

interface FetchParksJSONParams {
  language: AppLanguage;
}

interface FetchParkWithTranslationParams {
  parkId: string;
  language: AppLanguage;
}

const normalizeParkData = (rawPark: RawParkData): ParkJSON => {
  return {
    id: rawPark.id,
    name: rawPark.name,
    city: rawPark.city,
    address: rawPark.address,
    location: {
      lat: rawPark.location.lat,
      long: rawPark.location.lng || rawPark.location.long || 0,
    },
  };
};

const fetchAndParseParksFile = async (
  fileName: string
): Promise<RawParkData[] | null> => {
  try {
    const url = await getFileUrl({
      bucketName: 'parks',
      fileName,
    });

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const parks = await response.json();

    if (!Array.isArray(parks)) {
      console.error(`Invalid parks data format in ${fileName}: expected array`);
      return null;
    }

    return parks as RawParkData[];
  } catch (error) {
    console.warn(`Error fetching ${fileName}:`, error);
    return null;
  }
};

const fetchParksJSON = async (params: FetchParksJSONParams) => {
  const { language } = params;

  try {
    const languageFileName = `parks-${language}.json`;
    const languageResult = await fetchAndParseParksFile(languageFileName);

    if (!languageResult) {
      if (language === APP_LANGUAGES.EN) {
        throw new Error(`Failed to fetch parks JSON for language: ${language}`);
      }

      // fallback to english
      const englishFileName = `parks-${APP_LANGUAGES.EN}.json`;
      const englishResult = await fetchAndParseParksFile(englishFileName);

      if (!englishResult) {
        throw new Error(`Failed to fetch parks JSON for language: ${language}`);
      }

      return englishResult.map(normalizeParkData);
    }

    return languageResult.map(normalizeParkData);
  } catch (error) {
    throwError(error);
  }
};

// TODO: delete if not used
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

const fetchParkDataWithLanguage = async (
  parkId: string,
  language: AppLanguage
) => {
  const { data, error } = await supabase
    .from('parks')
    .select(
      `
      *,
      park_translations!inner(
        name,
        city,
        address,
        language
      )
    `
    )
    .eq('id', parkId)
    .eq('park_translations.language', language)
    .single();

  return { data, error };
};

const fetchParkWithTranslation = async (
  params: FetchParkWithTranslationParams
) => {
  const { parkId, language } = params;

  try {
    const { data: parkData, error } = await fetchParkDataWithLanguage(
      parkId,
      language
    );

    if (error || !parkData) {
      if (language === APP_LANGUAGES.EN) {
        throw error || new Error('Park not found');
      }

      // fallback to english
      const { data: fallbackData, error: fallbackError } =
        await fetchParkDataWithLanguage(parkId, APP_LANGUAGES.EN);

      if (fallbackError || !fallbackData) {
        throw fallbackError || new Error('Park not found');
      }

      if (
        !fallbackData.park_translations ||
        fallbackData.park_translations.length === 0
      ) {
        throw new Error('No translation data found');
      }

      const fallbackTranslation = fallbackData.park_translations[0];
      return {
        ...fallbackData,
        name: fallbackTranslation.name,
        city: fallbackTranslation.city,
        address: fallbackTranslation.address,
      } as TranslatedPark;
    }

    if (
      !parkData.park_translations ||
      parkData.park_translations.length === 0
    ) {
      throw new Error('No translation data found');
    }

    const translation = parkData.park_translations[0];
    return {
      ...parkData,
      name: translation.name,
      city: translation.city,
      address: translation.address,
    } as TranslatedPark;
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
        has_facilities: parkDetails.has_facilities,
      })
      .eq('id', parkId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(
      `there was an error while updating park ${parkId}: ${JSON.stringify(error)}`
    );
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
      path: `${parkId}/primary`,
      name: 'primary',
    });
    return res;
  } catch (error) {
    throwError(error);
  }
};

const fetchParkPrimaryImage = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory({
      bucket: 'parks',
      path: `${parkId}/primary/`,
    });
    return res?.[0] ?? null;
  } catch (error) {
    console.error(
      `there was a problem fetching primary image for park ${parkId}: ${JSON.stringify(error)}`
    );
    return null;
  }
};

const fetchAllParkImages = async (parkId: string) => {
  try {
    const res = await fetchImagesByDirectory({
      bucket: 'parks',
      path: `${parkId}/other/`,
    });
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
  fetchParkWithTranslation,
  uploadParkImage,
  uploadParkPrimaryImage,
  fetchParkPrimaryImage,
  fetchAllParkImages,
  updatePark,
};
