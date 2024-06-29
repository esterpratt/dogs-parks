import { ChangeEvent, useEffect, useRef, useState } from 'react';
import styles from './RangeInput.module.scss';
import { ControlledInput } from './ControlledInput';

interface RangeInputProps {
  min?: number;
  max?: number;
  step?: number;
  label: string;
  name: string;
  value?: string;
  sign?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({
  min = 0,
  max = 100,
  step = 1,
  label,
  name,
  value,
  sign = '%',
  onChange,
}) => {
  const inputContainerRef = useRef<HTMLDivElement | null>(null);
  const [bubbleStep, setBubbleStep] = useState(0);
  const halfThumbWidth = Number(styles.thumbWidth) / 2 + 1;

  useEffect(() => {
    setBubbleStep((inputContainerRef.current!.offsetWidth - 24) / max);
  }, [max]);

  return (
    <div className={styles.container} ref={inputContainerRef}>
      <ControlledInput
        inputClassName={styles.input}
        label={label}
        value={value || '0'}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        onChange={onChange}
      />
      {value !== '' && value !== undefined && (
        <output
          className={styles.output}
          htmlFor="range"
          style={{
            transform: `translateX(calc(${
              bubbleStep * Number(value)
            }px - 50% + ${halfThumbWidth}px))`,
          }}
        >
          {value}
          {sign}
        </output>
      )}
      <div className={styles.min}>
        {min}
        {sign}
      </div>
      <div className={styles.max}>
        {max}
        {sign}
      </div>
    </div>
  );
};

export { RangeInput };
