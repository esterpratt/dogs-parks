import { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { Button } from '../Button';
import styles from './Card.module.scss';

export interface ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
  disabled?: boolean;
}

interface CardProps {
  url?: string | null;
  imgCmp: ReactNode;
  detailsCmp: ReactNode;
  buttons?: ButtonProps[];
  onClick?: () => void;
  testId?: string;
}

const Card = (props: CardProps) => {
  const { url, imgCmp, detailsCmp, buttons, onClick, testId } = props;
  const TopContainer = url ? Link : 'div';

  return (
    <div className={styles.container} data-test={testId}>
      <TopContainer
        onClick={!url && onClick ? onClick : undefined}
        to={url ? url : ''}
        className={classnames(styles.topContainer)}
      >
        <div className={styles.img}>{imgCmp}</div>
        <div className={styles.details}>{detailsCmp}</div>
      </TopContainer>
      {!!buttons && !!buttons.length && (
        <div className={styles.buttons}>
          {buttons.map((button, index) => (
            <Button
              key={index}
              variant={button.variant || 'primary'}
              onClick={button.onClick}
              className={classnames(styles.button, button.className)}
              disabled={button.disabled}
            >
              {button.children}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export { Card };
