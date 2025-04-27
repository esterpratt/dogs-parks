import classnames from 'classnames';
import { Fragment, ReactNode } from 'react';
import { Star, StarHalf } from 'lucide-react';
import styles from './Stars.module.scss';

interface StarsProps {
  rank: number;
  size?: number;
  setRank?: (rank: number) => void;
  className?: string;
}

const Stars: React.FC<StarsProps> = ({
  rank,
  setRank,
  size = 14,
  className,
}) => {
  const starsIcons: ((index: number) => ReactNode)[] = [];

  let i = 1;
  for (i; i <= rank; i++) {
    starsIcons.push((index) => (
      <Fragment key={index}>
        <Star
          size={size}
          className={classnames(styles.star, styles.full)}
          onClick={() =>
            setRank
              ? setRank(index + 1 === rank ? index + 0.5 : index + 1)
              : () => {}
          }
        />
      </Fragment>
    ));
  }

  if (rank - Math.floor(rank) > 0) {
    starsIcons.push((index) => (
      <Fragment key={index}>
        <StarHalf
          size={size}
          onClick={() => (setRank ? setRank(index) : () => {})}
          className={classnames(styles.star, styles.half)}
        />
        <StarHalf
          style={{ marginLeft: `-${size}px` }}
          size={size}
          onClick={() => (setRank ? setRank(index) : () => {})}
          className={classnames(styles.star, styles.secondHalf)}
        />
      </Fragment>
    ));
    i += 1;
  }

  for (i; i <= 5; i++) {
    starsIcons.push((index) => (
      <Fragment key={index}>
        <Star
          size={size}
          onClick={() => (setRank ? setRank(index + 1) : () => {})}
          className={classnames(styles.star, styles.empty)}
        />
      </Fragment>
    ));
  }

  return (
    <div className={classnames(styles.container, className)}>
      {starsIcons.map((star, index) => star(index))}
    </div>
  );
};

export { Stars };
