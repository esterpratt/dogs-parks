import { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router';
import classnames from 'classnames';

import { Button } from '../Button';
import styles from './Card.module.scss';

interface ButtonProps {
  children: ReactNode;
  onClick?: (event: MouseEvent) => void;
  variant?: 'primary' | 'secondary';
  className?: string;
}

interface CardProps {
  url?: string | null;
  imgCmp: ReactNode;
  detailsCmp: ReactNode;
  buttons?: ButtonProps[];
  className?: string;
}

const Card = (props: CardProps) => {
  const { url, imgCmp, detailsCmp, buttons } = props;
  const TopContainer = url ? Link : 'div';

  return (
    <div className={styles.container}>
      <TopContainer
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
