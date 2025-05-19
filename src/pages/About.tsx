import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import styles from './About.module.scss';

const MAIL = 'esterpratt@gmail.com';

const About = () => {
  return (
    <div className={styles.container}>
      <h3>Welcome to KlavHub!</h3>
      <Link to="/privacy-policy">
        <Button variant="simple" className={styles.button}>
          See our Privacy Policy
        </Button>
      </Link>
      <div>
        <span>This app was created by: </span>
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
        <span>Special thanks to: </span>Kfir Arad, Rotem Koltz
      </div>
      <div>
        <span>Your support is greatly appreciated! </span>
        This app is just getting started, and I would love your help in growing
        the community. You can support by joining the community, sharing with
        friends, adding details about your local dog park, and contributing
        missing parks. For any suggestions or feedback, feel free to email me
        at:{' '}
        <Link to={`mailto:${MAIL}`}>
          <Button className={styles.button} variant="simple">
            {MAIL}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default About;
