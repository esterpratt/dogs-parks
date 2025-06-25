import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import styles from './About.module.scss';

const MAIL = 'esterpratt@gmail.com';

const About = () => {
  return (
    <div className={styles.container}>
      <div>
        <h3>Welcome to KlavHub!</h3>
        <span>
          KlavHub is built for dog lovers looking to find the best nearby dog
          parks and connect with friends.
        </span>
      </div>
      <div>
        <h2>Need help or have feedback?</h2>
        <span>
          If you're experiencing issues with the app or have any suggestions,
          feel free to reach out at:{' '}
          <Link to={`mailto:${MAIL}`}>
            <Button className={styles.button} variant="simple">
              {MAIL}.
            </Button>
          </Link>
        </span>
      </div>
      <div>
        <Link to="/privacy-policy">
          <Button variant="simple" className={styles.button}>
            View our privacy policy here.
          </Button>
        </Link>
      </div>
      <div>
        <span>
          This app is just getting started, and your help growing the community
          is deeply appreciated. You can support Klavhub by joining the
          community, sharing with friends, adding details about your local dog
          park, and contributing missing parks.
        </span>
      </div>
      <div>
        <span>Thank you!</span>
      </div>
      <div>
        <span>Created by: </span>
        <Link to="https://github.com/esterpratt">
          <Button className={styles.button} variant="simple">
            Ester Pratt.
          </Button>
        </Link>
      </div>

      <div>
        <span>Inspired by: </span>
        My special dog Nina, the dog who doesn't go to dog parks.
      </div>
      <div>
        <span>Special thanks to: </span>Kfir Arad, Rotem Koltz.
      </div>
    </div>
  );
};

export default About;
