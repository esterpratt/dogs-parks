interface FormInputProps extends React.HTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  type: string;
}

const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  type,
  ...props
}) => {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input id={name} type={type} name={name} required {...props} />
    </div>
  );
};

export { FormInput };
