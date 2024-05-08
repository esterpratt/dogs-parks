import { ReactNode } from 'react';

interface TableRowProps {
  columns: (string | number | ReactNode)[];
}

const TableRow: React.FC<TableRowProps> = ({ columns }) => {
  return (
    <tr>
      {columns.map((column, index) => {
        return (
          <td key={index}>
            <div>{column}</div>
          </td>
        );
      })}
    </tr>
  );
};

export { TableRow };
