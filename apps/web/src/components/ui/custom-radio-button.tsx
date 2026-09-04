interface CustomRadioButtonProps {
  name: string
  value: string
  label: string
  checked?: boolean
  onChange: (value: string) => void
  disabled?: boolean
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
      <div className="relative w-6 h-6 flex items-center justify-center">
        {/* Círculo externo: apenas a borda azul-clara */}
        <div
          className={`w-6 h-6 rounded-full border-4 ${
            checked ? "border-[#C3E8EE]" : "border-gray-300"
          }`}
        ></div>

        {/* Círculo interno azul-escuro se selecionado */}
        {checked && (
          <div className="absolute w-3 h-3 rounded-full bg-[#348C98]" />
        )}
      </div>

      <label
        htmlFor={value}
        className={`text-sm text-[#3D3D3D] ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer "
        }`}
      >
        {label}
      </label>
    </div>
  )
}
