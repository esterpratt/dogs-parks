import { MouseEvent } from 'react';
import { ThumbsDown, ThumbsUp } from 'lucide-react';
import classnames from 'classnames';
import { Dog } from '../../types/dog';
import { Button } from '../Button';
import { Section } from '../section/Section';
import styles from './DogPreferences.module.scss';

interface DogPreferencesProps {
  dog: Dog;
  onEditDog: (event: MouseEvent<HTMLButtonElement>) => void;
  userName: string;
  isSignedInUser: boolean;
}

const DogPreferences: React.FC<DogPreferencesProps> = ({
  dog,
  isSignedInUser,
  userName,
  onEditDog,
}) => {
  const likes = dog.likes ? dog.likes.filter((item) => item) : [];
  const dislikes = dog.dislikes ? dog.dislikes.filter((item) => item) : [];

  return (
    <Section
      className={styles.container}
      title="Preferences"
      contentCmp={
        <div
          className={classnames(styles.content, {
            [styles.withData]: likes.length || dislikes.length,
          })}
        >
          {!likes.length && !dislikes.length && (
            <>
              {isSignedInUser ? (
                <Button
                  variant="secondary"
                  className={styles.button}
                  onClick={onEditDog}
                >
                  Add your dog's preferences
                </Button>
              ) : (
                <div className={styles.empty}>
                  <span className={styles.userName}>{userName} </span>
                  <span>did not add their dog's preferences yet</span>
                </div>
              )}
            </>
          )}
          {!!likes.length && (
            <div className={styles.likes}>
              <ThumbsUp color={styles.blue} size={20} />
              <div className={styles.items}>
                {likes.map((like) => (
                  <span key={like}>{like}</span>
                ))}
              </div>
            </div>
          )}
          {!!dislikes.length && (
            <div className={styles.dislikes}>
              <ThumbsDown color={styles.red} size={20} />
              <div className={styles.items}>
                {dislikes.map((dislike) => (
                  <span key={dislike}>{dislike}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      }
    />
  );
};

export { DogPreferences };
