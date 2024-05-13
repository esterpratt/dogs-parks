import { IconContext } from 'react-icons';
import { AccordionArrow } from './AccordionArrow';
import { AccordionTitle } from './AccordionTitle';
import styles from './AccordionTitleWithIcon.module.scss';
import { ElementType, MouseEvent } from 'react';

interface AccordionTitleWithIconProps {
  title: string;
  showIcon: boolean;
  Icon: ElementType;
  iconSize?: number;
  onClickIcon: () => void;
}

const AccordionTitleWithIcon: React.FC<AccordionTitleWithIconProps> = ({
  title,
  showIcon,
  Icon,
  iconSize = 14,
  onClickIcon,
}) => {
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClickIcon();
  };

  return (
    <AccordionTitle className={styles.title}>
      {(isOpen) => (
        <>
          <div>
            <span>{title}</span>
            <AccordionArrow isOpen={isOpen} />
          </div>
          {showIcon && (
            <div onClick={onClick} className={styles.iconContainer}>
              <IconContext.Provider value={{ className: styles.icon }}>
                <Icon size={iconSize} />
              </IconContext.Provider>
            </div>
          )}
        </>
      )}
    </AccordionTitle>
  );
};

export { AccordionTitleWithIcon };
