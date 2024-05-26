import { Link } from 'react-router-dom';
import classnames from 'classnames';
import { ParkMaterial } from '../../types/park';
import { DetailsSqaure } from './DetailsSquare';
import styles from './ParkGenerals.module.scss';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';

interface ParkGeneralsProps {
  size?: number;
  ground?: ParkMaterial[];
  shade?: boolean;
  water?: boolean;
  parkId: string;
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
    if (value >= 100) {
      content = 'L';
    } else if (value < 50) {
      content = 'S';
    }
  }
  return content;
};

const ParkGenerals = ({
  size,
  ground,
  shade,
  water,
  parkId,
}: ParkGeneralsProps) => {
  const { friendsInParkIds, visitorsIds } = useGetParkVisitors(parkId);

  const friendsCount = friendsInParkIds.length;
  const othersCount = visitorsIds.length - friendsCount;

  const visitorsContent = friendsCount
    ? friendsCount.toString()
    : othersCount.toString();
  const sizeContent = getSizeContent(size);
  const groundContent = getListContent(ground);
  const shadeContent = getBooleanContent(shade);
  const waterContent = getBooleanContent(water);

  return (
    <div className={styles.container}>
      <DetailsSqaure title="Size" content={sizeContent} color={styles.orange} />
      <DetailsSqaure
        title="Ground"
        content={groundContent}
        color={styles.green}
        className={styles.ground}
      />
      <DetailsSqaure title="Shade" content={shadeContent} color={styles.grey} />
      <DetailsSqaure title="Water" content={waterContent} color={styles.blue} />
      <Link
        to="visitors"
        className={classnames(
          styles.link,
          !friendsCount && !othersCount && styles.disabled
        )}
      >
        <DetailsSqaure
          title={friendsCount ? 'Friends here' : 'Visitors'}
          content={visitorsContent}
          color={styles.brown}
        />
      </Link>
    </div>
  );
};

export { ParkGenerals };
