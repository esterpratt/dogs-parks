import { ChangeEvent } from 'react';
import classnames from 'classnames';
import { Search } from 'lucide-react';
import styles from './SearchInput.module.scss';

export interface SearchInputProps {
  value: string;
  onChangeInput: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = (props: SearchInputProps) => {
  const { value, onChangeInput, placeholder, className } = props;

  return (
    <div className={classnames(styles.inputContainer, className)}>
      <Search color={styles.pink} />
      <input
        value={value}
        onChange={onChangeInput}
        placeholder={placeholder}
        className={styles.input}
      />
    </div>
  );
};

export { SearchInput };
