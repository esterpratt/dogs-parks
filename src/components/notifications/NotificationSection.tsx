import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import classnames from 'classnames';
import { ToggleInput } from '../inputs/ToggleInput';
import styles from './NotificationSection.module.scss';

interface NotificationSectionProps {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
  isMute?: boolean;
}

const NotificationSection: React.FC<NotificationSectionProps> = ({
  title,
  description,
  value,
  onChange,
  isLast = false,
  isMute = false,
}) => {
  return (
    <div
      className={classnames(styles.settingItem, {
        [styles.settingItemLast]: isLast,
      })}
    >
      <div className={styles.settingInfo}>
        <div className={styles.settingDetails}>
          <span className={styles.settingLabel}>{title}</span>
          <span className={styles.settingDescription}>{description}</span>
        </div>
      </div>
      <ToggleInput
        variant="small"
        label=""
        value={value}
        valueOn={true}
        valueOff={false}
        onChange={onChange}
        iconOn={isMute ? <BellOff size={16} /> : <Bell size={16} />}
        iconOff={isMute ? <Bell size={16} /> : <BellOff size={16} />}
      />
    </div>
  );
};

export { NotificationSection };
