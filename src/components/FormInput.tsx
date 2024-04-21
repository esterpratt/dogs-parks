interface FormInputProps {
  name: string;
  label: string;
  type: string;
}

const FormInput: React.FC<FormInputProps> = ({ name, label, type }) => {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type={type} name={name} required />
    </div>
  );
};

export { FormInput };
