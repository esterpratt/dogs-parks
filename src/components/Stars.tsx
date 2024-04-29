interface StarsProps {
  rank: number;
}

const Stars: React.FC<StarsProps> = ({ rank }) => {
  return <div>{rank}</div>;
};

export { Stars };
