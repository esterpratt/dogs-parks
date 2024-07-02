import { Modal } from './Modal';
import styles from './AboutModal.module.scss';
import { Link } from 'react-router-dom';
import { MAIL } from '../services/reports';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centerTop"
      height="65%"
      className={styles.modalContent}
    >
      <h3>ברוכים הבאים לקלאבהאב!</h3>
      <div>
        <span>האפליקציה נוצרה על ידי: </span>
        <Link to="https://github.com/esterpratt">אסתר פרת</Link>
      </div>
      <div>
        <span>בהשראת: </span>
        הכלבה המיוחדת שלי נינה, הכלבה שלא הולכת לגינות כלבים
      </div>
      <div>
        <span>תודה מיוחדת ל: </span>כפיר ארד, רותם קולץ
      </div>
      <div>
        <span>אשמח לעזרתכם! </span>
        {`האפליקציה בתחילת דרכה. אשמח לעזרתכם בהצטרפות
        לקהילה, הזמנת חברים, הוספת פרטים על הגינה שלכם, והוספת גינות אם אינן
        קיימות באפליקציה. לכל הצעה, הערה והארה מוזמנים לשלוח לי מייל: 
        ${MAIL}`}
      </div>
    </Modal>
  );
};

export { AboutModal };
