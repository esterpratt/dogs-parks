import { useEffect, useState } from 'react';
import { FlagIcon, Pencil, X } from 'lucide-react';
import { Button } from '../Button';
import { Park } from '../../types/park';
import { EditParkModal } from './EditParkModal';
import { ReportParkModal } from './ReportParkModal';
import { BottomModal } from '../modals/BottomModal';
import styles from './ChooseEditParkOptionModal.module.scss';

interface ChooseEditParkOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  park: Park;
}

const ChooseEditParkOptionModal: React.FC<ChooseEditParkOptionModalProps> = ({
  isOpen,
  onClose,
  park,
}) => {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (isEditModalOpen || isReportModalOpen) {
      onClose();
    }
  }, [isReportModalOpen, isEditModalOpen, onClose]);

  const isEditable =
    !park.size ||
    !park.materials?.length ||
    park.shade === null ||
    park.has_facilities === null;

  const onEditPark = () => {
    setIsEditModalOpen(true);
  };

  const onReportPark = () => {
    setIsReportModalOpen(true);
  };

  return (
    <>
      <BottomModal open={isOpen} onClose={onClose} className={styles.modal}>
        <div className={styles.buttonsContainer}>
          {isEditable && (
            <Button onClick={onEditPark} className={styles.button}>
              <Pencil size={20} />
              <span>Update park details</span>
            </Button>
          )}
          <Button onClick={onReportPark} className={styles.button}>
            <FlagIcon size={20} />
            <span>Report incorrect details</span>
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className={styles.button}
          >
            <X size={20} />
            <span>Cancel</span>
          </Button>
        </div>
      </BottomModal>
      <ReportParkModal
        parkId={park.id}
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
      <EditParkModal
        park={park}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
};

export { ChooseEditParkOptionModal };
