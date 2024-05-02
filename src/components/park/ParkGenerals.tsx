import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ParkMaterial } from '../../types/park';
import { DetailsSqaure } from './DetailsSquare';
import { ParkVisitorsContext } from '../../context/ParkVisitorsContext';
import styles from './ParkGenerals.module.scss';

interface ParkGeneralsProps {
  size?: number;
  ground?: ParkMaterial[];
  shade?: boolean;
  water?: boolean;
}

const getBooleanContent = (value?: boolean) => {
  let content = '?';
  if (value) {
    content = 'V';
  } else if (value === false) {
    content = 'X';
  }
  return content;
};

const getListContent = (values?: string[]) => {
  let content = '?';
  if (values && values.length) {
    content = values
      .map((value) => value[0].toUpperCase() + value.slice(1))
      .join(' & ');
  }
  return content;
};

const getSizeContent = (value?: number) => {
  let content = '?';
  if (value) {
    content = 'M';
    if (value >= 50) {
      content = 'L';
    } else if (value <= 30) {
      content = 'S';
    }
  }
  return content;
};

const ParkGenerals = ({ size, ground, shade, water }: ParkGeneralsProps) => {
  const { visitors } = useContext(ParkVisitorsContext);

  const visitorsContent = visitors.friends.length
    ? visitors.friends.length.toString()
    : visitors.others.length.toString();
  const sizeContent = getSizeContent(size);
  const groundContent = getListContent(ground);
  const shadeContent = getBooleanContent(shade);
  const waterContent = getBooleanContent(water);

  return (
    <div className={styles.container}>
      <DetailsSqaure title="Size" content={sizeContent} color="#ECAC52" />
      <DetailsSqaure
        title="Ground"
        content={groundContent}
        color="#9AC457"
        className={styles.ground}
      />
      <DetailsSqaure title="Shade" content={shadeContent} color="#578796" />
      <DetailsSqaure title="Water" content={waterContent} color="#70C3D0" />
      <Link to="visitors" className={styles.link}>
        <DetailsSqaure
          title={visitors.friends.length ? 'Friends here' : 'Visitors'}
          content={visitorsContent}
          color="#BFA990"
        />
      </Link>
    </div>
  );
};

export { ParkGenerals };
