interface ControlledInputProps {
  value: string;
  label: string;
  name: string;
  placeholder?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ControlledInput: React.FC<ControlledInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  name,
}) => {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export { ControlledInput };
