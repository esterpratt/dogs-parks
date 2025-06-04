import { Button } from '../components/Button';
import styles from './DeleteAcount.module.scss';

// You can delete your full account and all associated data from inside the app:

// Go to your Profile

// Tap Settings > Delete Account

// This will permanently remove your account and all related data.

// Delete specific data (e.g., your dog)
// If you'd prefer to remove only part of your data, such as your dog’s profile:

// Open your Profile

// Tap on your dog’s profile

// Tap Delete Dog

// This removes the dog’s information without deleting your entire account.

const DeleteAcount = () => {
  return (
    <div className={styles.wrapper}>
      <h1>Deleting Your Data on KlavHub</h1>
      <div className={styles.section}>
        <h2>To delete your full account and all associated data:</h2>
        <p>1. Go to your profile</p>
        <p>2. {`Tap Settings -> Delete my profile`}</p>
        <p>3. Tap Delete</p>
        <p>This will permanently remove your account and all related data</p>
      </div>
      <div className={styles.section}>
        <h2>To delete your dog:</h2>
        <p>1. Go to your profile</p>
        <p>2. Tap on your dog's profile</p>
        <p>3. Tap the edit icon</p>
        <p>4. Scroll to and tap 'Say Goodbye...'</p>
        <p>Tap Delete</p>
        <p>
          When you delete your dog's profile, the data is removed from the app
          and inaccessible. It is not visible to other users and no longer
          retained for display or processing.
        </p>
      </div>
      <div className={styles.section}>
        <p>
          If you need help, contact us at:{' '}
          <a href="mailto:esterpratt@gmail.com">
            <Button variant="simple" className={styles.button}>
              esterpratt@gmail.com
            </Button>
          </a>
        </p>
      </div>
    </div>
  );
};

export default DeleteAcount;
