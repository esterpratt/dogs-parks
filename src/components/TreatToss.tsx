import { useState } from 'react';
import styles from './TreatToss.module.scss';
import DogIcon from '../assets/dog.svg?react';
import { Bone } from 'lucide-react';

const TreatToss = () => {
  const [tossing, setTossing] = useState(false);
  const [count, setCount] = useState(0);

  const handleClick = () => {
    if (tossing) return;
    setTossing(true);
    setCount((prev) => prev + 1);

    setTimeout(() => {
      setTossing(false);
    }, 800);
  };

  return (
    <div className={styles.container}>
      <div className={styles.animationContainer}>
        <div className={styles.boneWrapper} onClick={handleClick}>
          <div className={styles.bonePulse}>
            <Bone color={styles.pink} size={24} />
          </div>
        </div>

        <div className={styles.dog}>
          <DogIcon width={64} height={64} />
        </div>

        {tossing && (
          <div className={styles.tossedBone}>
            <Bone color={styles.pink} size={12} />
          </div>
        )}
      </div>
      {!!count && <div className={styles.count}>{count}</div>}
    </div>
  );
};

export { TreatToss };
