import styles from './PrivacyPolicy.module.scss';

const PrivacyPolicy = () => {
  return (
    <div className={styles.wrapper}>
      <h1>Privacy Policy</h1>
      <p>Last Updated: 28.1.25</p>
      <div className={styles.section}>
        <h2>1. Introduction</h2>
        <p>
          Welcome to Kluvhub. This privacy policy explains how we collect, use,
          and protect your information when you use our app, Kluvhub (the
          "App"). By using the App, you agree to the collection and use of
          information in accordance with this policy.
        </p>
      </div>
      <div className={styles.section}>
        <h2>2. Information We Collect</h2>
        <span>We may collect the following types of information:</span>
        <h3>Personal Information:</h3>
        <span>Name, email address.</span>
        <span>
          If you sign in using Google, we may collect profile details as per
          their policies.
        </span>
        <h3>Usage Data:</h3>
        <span>
          Information about how you interact with the App (e.g. features used,
          session duration)
        </span>
        <h3>Device Information:</h3>
        <span>
          Device type, operating system, IP address, and unique device
          identifiers
        </span>
        <h3>Approximate or precise location (only with your permission).</h3>
        <h3>Photos and other content you upload to the App.</h3>
      </div>
      <div className={styles.section}>
        <h2>3. How We Use Your Information</h2>
        <span>We use your data to:</span>
        <ul>
          <li>Provide and improve our services.</li>
          <li>Personalize your experience.</li>
          <li>Communicate updates and support.</li>
          <li>Analyze usage to enhance performance.</li>
          <li>Ensure security and prevent fraud</li>
        </ul>
      </div>
      <div className={styles.section}>
        <h2>4. How We Share Your Information</h2>
        <span>
          We do not sell your personal information. However, we may share data
          with:
        </span>
        <ul>
          <li>
            Service Providers – For analytics, hosting, or customer support.
          </li>
          <li>Legal Authorities – If required by law or to prevent fraud.</li>
        </ul>
      </div>
      <div className={styles.section}>
        <h2>5. Data Retention & Security</h2>
        <p>
          We keep your data only as long as necessary for its intended purpose.
          We implement industry-standard security measures to protect your data.
          However, no online service is 100% secure, so use the App at your own
          risk.
        </p>
      </div>
      <div className={styles.section}>
        <h2>6. Your Rights & Choices</h2>
        <span>Depending on your location, you may have rights such as:</span>
        <ul>
          <li>Access & Correction – Request a copy of your data.</li>
          <li>Deletion – Request that we delete your information.</li>
        </ul>
        <span>
          To exercise these rights, contact us at{' '}
          <a href="mailto:esterpratt@gmail.com">esterpratt@gmail.com</a>
        </span>
      </div>
      <div className={styles.section}>
        <h2>7. Children's Privacy</h2>
        <p>
          Our App is not intended for children under 13 (or 16 in some regions).
          We do not knowingly collect personal data from minors.
        </p>
      </div>
      <div className={styles.section}>
        <h2>8. Third-Party Services</h2>
        <p>
          We may use third-party services that collect data (e.g., Google
          Analytics, Firebase). Each third party has its own privacy policy:
        </p>
        <ul>
          <li>Google Analytics: https://policies.google.com/privacy</li>
          <li>Firebase: https://firebase.google.com/support/privacy</li>
        </ul>
      </div>
      <div className={styles.section}>
        <h2>9. Changes to This Privacy Policy</h2>
        <p>
          We may update this policy periodically. We will notify you of
          significant changes by updating the "Last Updated" date.
        </p>
      </div>
      <div className={styles.section}>
        <h2>10. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, contact us at:{' '}
          <a href="mailto:esterpratt@gmail.com">esterpratt@gmail.com</a>
        </p>
      </div>
    </div>
  );
};

export { PrivacyPolicy };

// 8. Third-Party Services
// (Include this if you use Google Analytics, Firebase, Facebook SDK, etc.)

// We may use third-party services that collect data (e.g., Google Analytics, Firebase).
// Each third party has its own privacy policy:
// Google Analytics: https://policies.google.com/privacy
// Firebase: https://firebase.google.com/support/privacy
// 9. Changes to This Privacy Policy

// We may update this policy periodically. We will notify you of significant changes by updating the "Last Updated" date.

// 10. Contact Us

// If you have questions about this Privacy Policy, contact us at:

// 📧 Email: [your email] -->
