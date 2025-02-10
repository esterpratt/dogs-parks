import { ReactNode } from 'react';
import styles from './TableRow.module.scss';

interface TableRowProps {
  columns: (string | number | ReactNode)[];
}

const TableRow: React.FC<TableRowProps> = ({ columns }) => {
  return (
    <tr>
      {columns.map((column, index) => {
        return (
          <td key={index}>
            <div className={styles.column}>{column}</div>
          </td>
        );
      })}
    </tr>
  );
};

export { TableRow };
