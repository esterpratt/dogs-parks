import { IconContext } from 'react-icons';
import { MdOutlineModeEditOutline } from 'react-icons/md';
import { FaExclamation } from 'react-icons/fa6';
import { CgClose } from 'react-icons/cg';
import { Button } from '../Button';
import { Modal } from '../Modal';
import styles from './ChooseEditParkOptionModal.module.scss';
import { EditParkModal } from './EditParkModal';
import { Park } from '../../types/park';
import { useEffect, useState } from 'react';
import { ReportParkModal } from './ReportParkModal';

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
    !park.hasShade ||
    !park.hasWater ||
    !park.hasFacilities;

  const onEditPark = () => {
    setIsEditModalOpen(true);
  };

  const onReportPark = () => {
    setIsReportModalOpen(true);
  };

  return (
    <>
      <Modal
        open={isOpen}
        onClose={onClose}
        className={styles.modal}
        variant="bottom"
      >
        <div className={styles.buttonsContainer}>
          {isEditable && (
            <Button onClick={onEditPark} className={styles.buttonContainer}>
              <IconContext.Provider value={{ className: styles.icon }}>
                <MdOutlineModeEditOutline />
              </IconContext.Provider>
              <span>Edit Park Details</span>
            </Button>
          )}
          <Button onClick={onReportPark} className={styles.buttonContainer}>
            <IconContext.Provider value={{ className: styles.icon }}>
              <FaExclamation />
            </IconContext.Provider>
            <span>Report Wrong Details</span>
          </Button>
          <Button onClick={onClose} className={styles.buttonContainer}>
            <IconContext.Provider value={{ className: styles.icon }}>
              <CgClose />
            </IconContext.Provider>
            <span>Cancel</span>
          </Button>
        </div>
      </Modal>
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
