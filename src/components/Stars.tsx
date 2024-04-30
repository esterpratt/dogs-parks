import { IconType } from 'react-icons';
import { PiStarBold, PiStarFill, PiStarHalfFill } from 'react-icons/pi';

interface StarsProps {
  rank: number;
  setRank?: (rank: number) => void;
}

interface StarIconProps {
  icon: IconType;
  clickFunction: (rank: number) => void;
}

const Stars: React.FC<StarsProps> = ({ rank, setRank }) => {
  const starsIcons: StarIconProps[] = [];

  let i = 1;
  for (i; i <= rank; i++) {
    starsIcons.push({
      icon: PiStarFill,
      clickFunction: (newRank) =>
        setRank
          ? setRank(newRank === rank ? newRank - 0.5 : newRank)
          : () => {},
    });
  }

  if (rank - Math.floor(rank) > 0) {
    starsIcons.push({
      icon: PiStarHalfFill,
      clickFunction: (newRank) => (setRank ? setRank(newRank - 1) : () => {}),
    });
    i += 1;
  }

  for (i; i <= 5; i++) {
    starsIcons.push({
      icon: PiStarBold,
      clickFunction: (newRank) => (setRank ? setRank(newRank) : () => {}),
    });
  }

  return (
    <div>
      {starsIcons.map((star, index) => (
        <star.icon
          key={index}
          onClick={() => star.clickFunction(index + 1)}
        ></star.icon>
      ))}
    </div>
  );
};

export { Stars };
