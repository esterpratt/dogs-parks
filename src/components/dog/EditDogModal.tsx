import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import classnames from 'classnames';
import { DOG_ENERGY, DOG_SIZE, Dog, GENDER } from '../../types/dog';
import { UserContext } from '../../context/UserContext';
import { useDateUtils } from '../../hooks/useDateUtils';
import { ControlledInput } from '../inputs/ControlledInput';
import { RadioInputs } from '../inputs/RadioInputs';
import { TextArea } from '../inputs/TextArea';
import { AutoComplete } from '../inputs/AutoComplete';
import { dogBreeds } from '../../services/dog-breeds';
import { DeleteDogModal } from './DeleteDogModal';
import { useOrientationContext } from '../../context/OrientationContext';
import { Button } from '../Button';
import { FormModal } from '../modals/FormModal';
import useKeyboardFix from '../../hooks/useKeyboardFix';
import { capitalizeText } from '../../utils/text';
import { useUpdateDog } from '../../hooks/api/useUpdateDog';
import { useAddDog } from '../../hooks/api/useAddDog';
import { useScrollToInputOnOpen } from '../../hooks/useScrollToInputOnOpen';
import { doesBreedMatchUserInput } from '../../utils/searchDog';
import styles from './EditDogModal.module.scss';

interface EditDogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDog?: (dogId?: string) => void;
  dog?: Dog;
}

const EditDogModal: React.FC<EditDogModalProps> = (props) => {
  const { isOpen, onClose, onAddDog, dog } = props;

  const orientation = useOrientationContext((state) => state.orientation);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [dogData, setDogData] = useState<
    | (Partial<Omit<Dog, 'likes' | 'dislikes'>> &
        Required<Pick<Dog, 'name'>> & {
          likes?: string;
          dislikes?: string;
        })
    | null
  >(() => {
    if (dog) {
      return {
        ...dog,
        likes: dog.likes?.join(', '),
        dislikes: dog.dislikes?.join(', '),
      };
    } else {
      return null;
    }
  });

  const { userId } = useContext(UserContext);
  const [isDeleteDogModalOpen, setIsDeleteDogModalOpen] = useState(false);
  const keyboardHeight = useKeyboardFix();

  const { mutateDog } = useUpdateDog();
  const { addDog } = useAddDog(onAddDog);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (dog) {
      setDogData({
        ...dog,
        likes: dog.likes?.join(', '),
        dislikes: dog.dislikes?.join(', '),
      });
    } else {
      setDogData(null);
    }
  }, [dog]);

  const onInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    value?: string | number
  ) => {
    setDogData((previousDogData) => {
      return {
        ...previousDogData,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  const onAutoCompleteSelect = (name: string, value: string) => {
    setDogData((previousDogData) => {
      return {
        ...previousDogData,
        [name]: value,
      };
    });
  };

  const onSubmit = async () => {
    const likes =
      dogData!.likes?.split(',').map((likeItem) => likeItem.trim()) || [];
    const dislikes =
      dogData!.dislikes?.split(',').map((dislikeItem) => dislikeItem.trim()) ||
      [];
    const birthday = !dogData!.birthday
      ? dogData!.birthday
      : new Date(dogData!.birthday);

    if (dog) {
      const dogFullData = Object.fromEntries(
        Object.entries(dogData!).filter(([, value]) => value !== undefined)
      );
      mutateDog({
        dogId: dog.id,
        dogDetails: { ...dogFullData, birthday, likes, dislikes },
      });
    } else {
      addDog({
        owner: userId!,
        ...dogData!,
        birthday,
        likes,
        dislikes,
      });
    }
    onClose();
  };

  const { getFormattedDateISO } = useDateUtils();

  const formattedBirthday = useMemo(() => {
    return !dogData?.birthday
      ? ''
      : getFormattedDateISO(new Date(dogData.birthday));
  }, [dogData?.birthday, getFormattedDateISO]);

  const formattedCurrentDate = useMemo(() => {
    return getFormattedDateISO(new Date());
  }, [getFormattedDateISO]);

  useScrollToInputOnOpen(isOpen, inputRef, formRef);

  const isSaveButtonDisabled =
    !dogData?.name || !dogData.birthday || !dogData.gender || !dogData.breed;

  const sortedDogBreeds = useMemo(() => {
    const pinned = dogBreeds.slice(0, 2);

    const tail = dogBreeds.slice(2);

    const sortedTail = [...tail].sort((a, b) => {
      const aLabel = t(`dogs.breeds.${a}`, { defaultValue: a });
      const bLabel = t(`dogs.breeds.${b}`, { defaultValue: b });
      return aLabel.localeCompare(bLabel, i18n.language);
    });

    return [...pinned, ...sortedTail];
  }, [t, i18n.language]);

  return (
    <>
      <FormModal
        open={isOpen}
        onClose={onClose}
        height={orientation === 'landscape' ? 98 : null}
        onSave={onSubmit}
        disabled={isSaveButtonDisabled}
        className={styles.modal}
        title={
          dog
            ? t('dogs.edit.titleUpdate', { name: dog.name })
            : t('dogs.edit.titleAdd')
        }
      >
        <form
          ref={formRef}
          className={classnames(styles.form, {
            [styles.extraPadding]: !!keyboardHeight,
            [styles.withDog]: !!dog,
          })}
        >
          <ControlledInput
            value={capitalizeText(dogData?.name ?? '') || ''}
            onChange={onInputChange}
            name="name"
            label={t('dogs.edit.labels.name')}
            required
          />
          <AutoComplete
            items={sortedDogBreeds}
            itemKeyfn={(breedId) => breedId}
            filterFunc={(breedId, rawUserInput) =>
              doesBreedMatchUserInput({
                breedId,
                rawUserInput,
                translate: t,
                currentLanguage: i18n.language,
              })
            }
            equalityFunc={(breedId, selectedInput) => breedId === selectedInput}
            setSelectedInput={(breedId) =>
              onAutoCompleteSelect('breed', breedId)
            }
            selectedInput={dogData?.breed || ''}
            label={t('dogs.edit.labels.breed')}
            selectedInputFormatter={(selectedId) =>
              t(`dogs.breeds.${selectedId}`, { defaultValue: selectedId })
            }
          >
            {(breedId, isChosen) => (
              <div
                className={classnames(styles.breed, isChosen && styles.chosen)}
              >
                {t(`dogs.breeds.${breedId}`, { defaultValue: breedId })}
              </div>
            )}
          </AutoComplete>

          <RadioInputs
            value={dogData?.gender || ''}
            options={[
              {
                value: GENDER.FEMALE,
                id: GENDER.FEMALE,
                label: t('dogs.gender.FEMALE'),
              },
              {
                value: GENDER.MALE,
                id: GENDER.MALE,
                label: t('dogs.gender.MALE'),
              },
            ]}
            onOptionChange={onInputChange}
            name="gender"
            label={t('dogs.edit.labels.gender')}
          />
          <ControlledInput
            defaultValue={formattedBirthday}
            onChange={onInputChange}
            name="birthday"
            label={t('dogs.edit.labels.birthday')}
            type="date"
            max={formattedCurrentDate}
            style={{ minHeight: '55px' }}
            required
          />
          <RadioInputs
            value={dogData?.size || ''}
            options={[
              {
                value: DOG_SIZE.LARGE,
                id: DOG_SIZE.LARGE,
                label: t('dogs.size.LARGE'),
              },
              {
                value: DOG_SIZE.MEDIUM,
                id: DOG_SIZE.MEDIUM,
                label: t('dogs.size.MEDIUM'),
              },
              {
                value: DOG_SIZE.SMALL,
                id: DOG_SIZE.SMALL,
                label: t('dogs.size.SMALL'),
              },
            ]}
            onOptionChange={onInputChange}
            name="size"
            label={t('dogs.edit.labels.size')}
          />
          <ControlledInput
            value={dogData?.temperament || ''}
            onChange={onInputChange}
            name="temperament"
            label={t('dogs.edit.labels.temperament')}
            maxLength={50}
          />
          <RadioInputs
            value={dogData?.energy || ''}
            options={[
              {
                value: DOG_ENERGY.HIGH,
                id: DOG_ENERGY.HIGH,
                label: t('dogs.energy.HIGH'),
              },
              {
                value: DOG_ENERGY.MEDIUM,
                id: DOG_ENERGY.MEDIUM,
                label: t('dogs.energy.MEDIUM'),
              },
              {
                value: DOG_ENERGY.LOW,
                id: DOG_ENERGY.LOW,
                label: t('dogs.energy.LOW'),
              },
            ]}
            onOptionChange={onInputChange}
            name="energy"
            label={t('dogs.edit.labels.energy')}
          />
          <ControlledInput
            value={dogData?.possessive || ''}
            onChange={onInputChange}
            name="possessive"
            label={t('dogs.edit.labels.possessive')}
            maxLength={50}
          />
          <ControlledInput
            value={dogData?.likes || ''}
            onChange={onInputChange}
            name="likes"
            label={t('dogs.edit.labels.likes')}
            inputRef={inputRef}
          />
          <ControlledInput
            value={dogData?.dislikes || ''}
            onChange={onInputChange}
            name="dislikes"
            label={t('dogs.edit.labels.dislikes')}
          />
          <TextArea
            rows={orientation === 'landscape' ? 3 : 9}
            maxLength={330}
            value={dogData?.description || ''}
            onChange={onInputChange}
            name="description"
            label={t('dogs.edit.labels.description')}
            className={styles.description}
          />
        </form>
        {dog && (
          <Button
            variant="secondary"
            color={styles.red}
            onClick={() => setIsDeleteDogModalOpen(true)}
            className={styles.deleteDogWrapper}
          >
            <Trash2 size={16} />
            <div>{t('settings.deleteDogButton', { name: dog.name })}</div>
          </Button>
        )}
      </FormModal>
      {dog && (
        <DeleteDogModal
          isOpen={isDeleteDogModalOpen}
          onClose={() => setIsDeleteDogModalOpen(false)}
          dog={dog}
        />
      )}
    </>
  );
};

export { EditDogModal };
