interface CustomRadioButtonProps {
  name: string;
  value: string;
  label: string;
  checked?: boolean;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const CustomRadioButton = ({
  value,
  label,
  checked = false,
  onChange,
  disabled = false,
}: CustomRadioButtonProps) => {
  return (
    <div
      className={`flex items-center space-x-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={() => onChange(value)}
    >
      <div className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
        {/* Anel: filete quando livre, turquesa quando marcado */}
        <div
          className={`h-[18px] w-[18px] rounded-full border bg-white transition-colors ${
            checked ? "border-acao" : "border-filete-forte"
          }`}
        ></div>

        {checked && <div className="absolute h-2 w-2 rounded-full bg-acao" />}
      </div>

      <label
        htmlFor={value}
        className={`text-[14px] text-tinta ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer "
        }`}
      >
        {label}
      </label>
    </div>
  );
};
