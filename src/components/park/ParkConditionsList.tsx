import { ParkCondition, ActiveParkCondition } from '../../types/parkCondition';
import styles from './ParkConditionsList.module.scss';
import { ConditionItem } from './ConditionItem';

interface ParkConditionsListProps {
  conditions: ActiveParkCondition[];
}

const ParkConditionsList = ({ conditions }: ParkConditionsListProps) => {
  const gatesClosedCondition = conditions.find(
    (conditionReport) => conditionReport.condition === ParkCondition.GATE_CLOSED
  );
  
  const underConstructionCondition = conditions.find(
    (conditionReport) => conditionReport.condition === ParkCondition.UNDER_CONSTRUCTION
  );

  if (conditions.length === 0) {
    return null;
  }

  if (gatesClosedCondition) {
    return (
      <div className={styles.exclusiveConditionContainer}>
        <ConditionItem conditionObservation={gatesClosedCondition} />
      </div>
    );
  }

  if (underConstructionCondition) {
    return (
      <div className={styles.exclusiveConditionContainer}>
        <ConditionItem conditionObservation={underConstructionCondition} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {conditions.map((condition) => (
        <ConditionItem
          key={condition.park_id + condition.condition}
          conditionObservation={condition}
        />
      ))}
    </div>
  );
};

export { ParkConditionsList };
