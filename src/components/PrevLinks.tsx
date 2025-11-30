import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import classnames from 'classnames';
import styles from './PrevLinks.module.scss';

interface LinkItem {
  to: string;
  text: string;
  icon: ReactNode;
  state?: Record<string, unknown>;
}

interface PrevLinksProps {
  links: LinkItem | LinkItem[];
  className?: string;
}

const PrevLinks: React.FC<PrevLinksProps> = (props) => {
  const { links, className } = props;

  const linksArray = Array.isArray(links) ? links : [links];
  const isMultipleLinks = linksArray.length > 1;

  return (
    <div
      className={classnames(
        styles.prevLinks,
        { [styles.spaceBetween]: isMultipleLinks },
        className
      )}
    >
      {linksArray.map((link, index) => {
        const isLastLink = isMultipleLinks && index === linksArray.length - 1;
        return (
          <Link
            key={index}
            to={link.to}
            state={link.state}
            className={classnames({ [styles.reverse]: isLastLink })}
          >
            {link.icon}
            <span>{link.text}</span>
          </Link>
        );
      })}
    </div>
  );
};

export { PrevLinks };
