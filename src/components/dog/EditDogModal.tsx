import {
  ChangeEvent,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRevalidator } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import classnames from 'classnames';
import { DOG_ENERGY, DOG_SIZE, Dog, GENDER } from '../../types/dog';
import { UserContext } from '../../context/UserContext';
import {
  createDog,
  updateDog,
  EditDogProps as UpdateDogProps,
} from '../../services/dogs';
import { queryClient } from '../../services/react-query';
import { getFormattedDate } from '../../utils/time';
import { ControlledInput } from '../inputs/ControlledInput';
import { RadioInputs } from '../inputs/RadioInputs';
import { TextArea } from '../inputs/TextArea';
import { AutoComplete } from '../inputs/AutoComplete';
import { dogBreeds } from '../../services/dog-breeds';
import DeleteDogModal from './DeleteDogModal';
import { useOrientationContext } from '../../context/OrientationContext';
import { useNotification } from '../../context/NotificationContext';
import { Button } from '../Button';
import { Trash2 } from 'lucide-react';
import { FormModal } from '../modals/FormModal';
import styles from './EditDogModal.module.scss';
import useKeyboardFix from '../../hooks/useKeyboardFix';

interface EditDogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDog?: (dogId?: string) => void;
  dog?: Dog;
}

const EditDogModal: React.FC<EditDogModalProps> = ({
  isOpen,
  onClose,
  onAddDog,
  dog,
}) => {
  const orientation = useOrientationContext((state) => state.orientation);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { notify } = useNotification();
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
  const { revalidate } = useRevalidator();
  const [isDeleteDogModalOpen, setIsDeleteDogModalOpen] = useState(false);
  const keyboardHeight = useKeyboardFix();

  const { mutate: mutateDog } = useMutation({
    mutationFn: (data: UpdateDogProps) =>
      updateDog({ dogId: data.dogId, dogDetails: data.dogDetails }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ['dogs', vars.dogId] });
      const prevDog = queryClient.getQueryData<Dog>(['dogs', vars.dogId]);
      queryClient.setQueryData(['dogs', vars.dogId], {
        ...prevDog,
        ...vars.dogDetails,
      });
      return { prevDog };
    },
    onError: (_error, vars, context) => {
      queryClient.setQueryData(['dogs', vars.dogId], context?.prevDog);
    },
    onSuccess: () => {
      notify();
    },
    onSettled: (_data, _error, vars) => {
      queryClient.invalidateQueries({ queryKey: ['dogs', vars.dogId] });
      queryClient.invalidateQueries({ queryKey: ['dogs', userId] });
      revalidate();
    },
  });

  const { mutateAsync: addDog } = useMutation({
    mutationFn: (data: Omit<Dog, 'id'>) => createDog({ ...data }),
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ['dogs', userId],
      });
      revalidate();
    },
    onSettled: (data) => {
      if (onAddDog) {
        onAddDog(data);
      }
    },
  });

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
    setDogData((prev) => {
      return {
        ...prev,
        [event.target.name]: value || event.target.value,
      };
    });
  };

  const onAutoCompleteSelect = (name: string, value: string) => {
    setDogData((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const onSubmit = async () => {
    const likes = dogData!.likes?.split(',').map((like) => like.trim()) || [];
    const dislikes =
      dogData!.dislikes?.split(',').map((like) => like.trim()) || [];
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

  const formattedBirthday = useMemo(() => {
    return !dogData?.birthday ? '' : getFormattedDate(dogData.birthday);
  }, [dogData?.birthday]);

  const formattedCurrentDate = useMemo(() => {
    return getFormattedDate(new Date());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      const shouldScroll = sessionStorage.getItem('scroll-to-input') === 'true';
      if (shouldScroll) {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        sessionStorage.removeItem('scroll-to-input');
      } else {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  }, [isOpen]);

  const isSaveButtonDisabled =
    !dogData?.name || !dogData.birthday || !dogData.gender || !dogData.breed;

  return (
    <>
      <FormModal
        open={isOpen}
        onClose={onClose}
        height={orientation === 'landscape' ? 98 : null}
        onSave={onSubmit}
        disabled={isSaveButtonDisabled}
        className={styles.modal}
        title={dog ? `Update ${dog.name}'s details` : `Add your dog's details`}
      >
        <form
          ref={formRef}
          className={classnames(styles.form, {
            [styles.extraPadding]: !!keyboardHeight,
            [styles.withDog]: !!dog,
          })}
        >
          <ControlledInput
            value={dogData?.name || ''}
            onChange={onInputChange}
            name="name"
            label="Name *"
            required
          />
          <AutoComplete
            items={dogBreeds}
            itemKeyfn={(item) => item}
            filterFunc={(item, searchInput) =>
              item.toLowerCase().includes(searchInput.toLowerCase())
            }
            equalityFunc={(item, selectedInput) => item === selectedInput}
            setSelectedInput={(item) => onAutoCompleteSelect('breed', item)}
            selectedInput={dogData?.breed || ''}
            label="Breed *"
          >
            {(item, isChosen) => (
              <div
                className={classnames(styles.breed, isChosen && styles.chosen)}
              >
                {item}
              </div>
            )}
          </AutoComplete>
          <RadioInputs
            value={dogData?.gender || ''}
            options={[
              { value: GENDER.FEMALE, id: GENDER.FEMALE },
              { value: GENDER.MALE, id: GENDER.MALE },
            ]}
            onOptionChange={onInputChange}
            name="gender"
            label="Gender *"
          />
          <ControlledInput
            defaultValue={formattedBirthday}
            onChange={onInputChange}
            name="birthday"
            label="Birthday *"
            type="date"
            max={formattedCurrentDate}
            style={{ minHeight: '55px' }}
            required
          />
          <RadioInputs
            value={dogData?.size || ''}
            options={[
              { value: DOG_SIZE.LARGE, id: DOG_SIZE.LARGE },
              { value: DOG_SIZE.MEDIUM, id: DOG_SIZE.MEDIUM },
              { value: DOG_SIZE.SMALL, id: DOG_SIZE.SMALL },
            ]}
            onOptionChange={onInputChange}
            name="size"
            label="Size"
          />
          <ControlledInput
            value={dogData?.temperament || ''}
            onChange={onInputChange}
            name="temperament"
            label="Temperament"
            maxLength={50}
          />
          <RadioInputs
            value={dogData?.energy || ''}
            options={[
              { value: DOG_ENERGY.HIGH, id: DOG_ENERGY.HIGH },
              { value: DOG_ENERGY.MEDIUM, id: DOG_ENERGY.MEDIUM },
              { value: DOG_ENERGY.LOW, id: DOG_ENERGY.LOW },
            ]}
            onOptionChange={onInputChange}
            name="energy"
            label="Energy"
          />
          <ControlledInput
            value={dogData?.possessive || ''}
            onChange={onInputChange}
            name="possessive"
            label="Possessive"
            maxLength={50}
          />
          <ControlledInput
            value={dogData?.likes || ''}
            onChange={onInputChange}
            name="likes"
            label="Likes (separate with commas)"
            inputRef={inputRef}
          />
          <ControlledInput
            value={dogData?.dislikes || ''}
            onChange={onInputChange}
            name="dislikes"
            label="Dislikes (separate with commas)"
          />
          <TextArea
            rows={orientation === 'landscape' ? 3 : 9}
            maxLength={330}
            value={dogData?.description || ''}
            onChange={onInputChange}
            name="description"
            label="Description"
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
            <span>Say goodbye to {dog.name}</span>
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
