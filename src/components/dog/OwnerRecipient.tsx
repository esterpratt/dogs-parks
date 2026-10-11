import { User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AutoComplete } from '../inputs/AutoComplete';
import styles from '../../pages/DogOwnership.module.scss';

interface RecipientMember {
  id: string;
  user_name?: string | null;
}
interface OwnerRecipientProps {
  members: RecipientMember[];
  value: string;
  onChange: (memberId: string) => void;
}

const OwnerRecipient = (props: OwnerRecipientProps) => {
  const { members, value, onChange } = props;
  const { t } = useTranslation();
  const selectedMember =
    members.find((member) => member.id === value) ?? members[0];
  const memberName = (member: RecipientMember) =>
    member.user_name ?? t('dogOwnership.memberFallback');

  // A sole eligible owner is a recipient, not a choice the user must make.
  if (members.length === 1) {
    return (
      <div className={styles.actions}>
        <span>{t('dogOwnership.successorLabel')}</span>
        <div className={styles.recipient}>
          <UserIcon size={24} aria-hidden="true" />
          <span>{memberName(members[0])}</span>
        </div>
      </div>
    );
  }
  return (
    <AutoComplete
      inlineDropdown
      showAllOnFocus
      label={t('dogOwnership.successorLabel')}
      items={members}
      selectedInput={selectedMember ? memberName(selectedMember) : ''}
      itemKeyfn={(member) => member.id}
      equalityFunc={(member) => member.id === selectedMember?.id}
      filterFunc={(member, search) =>
        memberName(member)
          .toLocaleLowerCase()
          .includes(search.toLocaleLowerCase())
      }
      setSelectedInput={(member) => onChange(member.id)}
    >
      {(member) => (
        <span className={styles.recipientOption}>
          <UserIcon size={24} aria-hidden="true" />
          {memberName(member)}
        </span>
      )}
    </AutoComplete>
  );
};

export { OwnerRecipient };
