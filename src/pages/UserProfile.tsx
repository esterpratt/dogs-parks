import { useOutletContext } from 'react-router';

const UserProfile: React.FC = () => {
  // TODO: get user by userId
  const userId = useOutletContext<string | null>();

  return (
    <div>
      <span>Welcome {userId}</span>
    </div>
  );
};

export { UserProfile };
