import { ParkCondition, ActiveParkCondition } from '../../types/parkCondition';
import { ParkConditionItem } from './ParkConditionItem';
import styles from './ParkConditionsList.module.scss';

interface ParkConditionsListProps {
  conditions: ActiveParkCondition[];
}

const ParkConditionsList = ({ conditions }: ParkConditionsListProps) => {
  const gatesClosedCondition = conditions.find(
    (conditionReport) => conditionReport.condition === ParkCondition.GATE_CLOSED
  );

  const underConstructionCondition = conditions.find(
    (conditionReport) =>
      conditionReport.condition === ParkCondition.UNDER_CONSTRUCTION
  );

  if (conditions.length === 0) {
    return null;
  }

  if (gatesClosedCondition) {
    return <ParkConditionItem conditionObservation={gatesClosedCondition} />;
  }

  if (underConstructionCondition) {
    return (
      <ParkConditionItem conditionObservation={underConstructionCondition} />
    );
  }

  return (
    <div className={styles.container}>
      {conditions.map((condition) => (
        <ParkConditionItem
          key={condition.park_id + condition.condition}
          conditionObservation={condition}
        />
      ))}
    </div>
  );
};

export { ParkConditionsList };
