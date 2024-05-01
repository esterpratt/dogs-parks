import { IconContext } from 'react-icons';
import { FaStar, FaStarHalf } from 'react-icons/fa';
import classnames from 'classnames';
import styles from './Stars.module.scss';
import { Fragment, ReactNode } from 'react';

interface StarsProps {
  rank: number;
  setRank?: (rank: number) => void;
}

const Stars: React.FC<StarsProps> = ({ rank, setRank }) => {
  const starsIcons: ((index: number) => ReactNode)[] = [];

  let i = 1;
  for (i; i <= rank; i++) {
    starsIcons.push((index) => (
      <IconContext.Provider
        key={index}
        value={{ className: classnames(styles.star, styles.full) }}
      >
        <FaStar
          onClick={() =>
            setRank
              ? setRank(index + 1 === rank ? index + 0.5 : index + 1)
              : () => {}
          }
        />
      </IconContext.Provider>
    ));
  }

  if (rank - Math.floor(rank) > 0) {
    starsIcons.push((index) => (
      <Fragment key={index}>
        <IconContext.Provider
          value={{ className: classnames(styles.star, styles.half) }}
        >
          <FaStarHalf onClick={() => (setRank ? setRank(index) : () => {})} />
        </IconContext.Provider>
        <IconContext.Provider
          value={{ className: classnames(styles.star, styles.secondHalf) }}
        >
          <FaStarHalf onClick={() => (setRank ? setRank(index) : () => {})} />
        </IconContext.Provider>
      </Fragment>
    ));
    i += 1;
  }

  for (i; i <= 5; i++) {
    starsIcons.push((index) => (
      <IconContext.Provider
        key={index}
        value={{ className: classnames(styles.star, styles.empty) }}
      >
        <FaStar onClick={() => (setRank ? setRank(index + 1) : () => {})} />
      </IconContext.Provider>
    ));
  }

  return (
    <div className={styles.container}>
      {starsIcons.map((star, index) => star(index))}
    </div>
  );
};

export { Stars };
