import { FaLocationDot } from 'react-icons/fa6';
import { Location } from '../../types/park';
import { CustomMarker } from './CustomMarker';
import { renderToStaticMarkup } from 'react-dom/server';
import { useMemo } from 'react';

interface UserLocationMarkerProps {
  location: Location;
}

const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({
  location,
}) => {
  const iconUrl = useMemo(
    () =>
      `data:image/svg+xml,${encodeURIComponent(
        renderToStaticMarkup(<FaLocationDot color="#578796" />)
      )}`,
    []
  );

  return (
    <CustomMarker
      location={location}
      iconUrl={iconUrl}
      iconSize={32}
      iconAnchor={[16, 32]}
    />
  );
};

export { UserLocationMarker };
