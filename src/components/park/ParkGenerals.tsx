import { Link } from 'react-router';
import classnames from 'classnames';
import { ParkMaterial } from '../../types/park';
import { DetailsSqaure } from './DetailsSquare';
import styles from './ParkGenerals.module.scss';
import { useGetParkVisitors } from '../../hooks/api/useGetParkVisitors';

interface ParkGeneralsProps {
  size?: number;
  ground?: ParkMaterial[];
  facilities?: boolean;
  shade?: number;
  water?: boolean;
  parkId: string;
}

const NO_CONTENT = '?';

const getNumberContent = (value?: number, sign?: string) => {
  let content = NO_CONTENT;
  if (value !== undefined && value !== null) {
    content = `${value}${sign ? sign : ''}`;
  }
  return content;
};

const getBooleanContent = (value?: boolean) => {
  let content = NO_CONTENT;
  if (value) {
    content = 'Y';
  } else if (value === false) {
    content = 'N';
  }
  return content;
};

const getListContent = (values?: string[]) => {
  let content = NO_CONTENT;
  if (values && values.length) {
    content = values
      .map((value) => value[0].toUpperCase() + value.slice(1))
      .join(' & ');
  }
  return content;
};

const getSizeContent = (value?: number) => {
  let content = NO_CONTENT;
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
  facilities,
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
  const facilitiesContent = getBooleanContent(facilities);
  const shadeContent = getNumberContent(shade, '%');
  const waterContent = getBooleanContent(water);

  return (
    <div className={styles.container}>
      <DetailsSqaure title="Size" content={sizeContent} color={styles.orange} />
      <DetailsSqaure
        title="Ground"
        content={groundContent}
        color={styles.brown}
        className={classnames(
          styles.ground,
          ground?.length && ground?.length > 2 && styles.long,
          groundContent === NO_CONTENT && styles.noContent
        )}
      />
      <DetailsSqaure
        title="Facilities"
        content={facilitiesContent}
        color={styles.darkGreen}
      />
      <DetailsSqaure
        title="Shade"
        content={shadeContent}
        color={styles.grey}
        className={classnames(
          styles.shade,
          shadeContent === NO_CONTENT && styles.noContent
        )}
        style={{
          background: `linear-gradient(to top, ${styles.grey} 0%, ${
            styles.grey
          } ${shade || 0}%, ${styles.transparentGrey} ${shade || 0}%, ${
            styles.transparentGrey
          } 100%)`,
        }}
      />
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
          color={styles.green}
        />
      </Link>
    </div>
  );
};

export { ParkGenerals };
