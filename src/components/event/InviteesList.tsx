import { Invitee } from '../../types/parkEvent';
// import styles from './InviteesList.module.scss';

interface InviteesListProps {
  invitees: Invitee[];
  userId: string | null;
}

const InviteesList: React.FC<InviteesListProps> = (
  props: InviteesListProps
) => {
  const { invitees, userId } = props;

  console.log(invitees, userId);

  return <div>Invitees:</div>;
};

export { InviteesList };
