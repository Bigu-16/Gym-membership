import { PhoneInput, removeDialCode } from 'react-international-phone';
import 'react-international-phone/style.css';

export const UAE_ISO2 = 'ae';

/**
 * Phone number input with country code picker, defaulting to the UAE (+971).
 * Restricts input length by enforcing the country phone mask with overflow disabled.
 */
const PhoneInputField = ({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = '50 123 4567',
  defaultCountry = UAE_ISO2,
  preferredCountries = [UAE_ISO2],
  inputProps = {},
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const handleChange = (phone, meta) => {
    const dialCode = meta?.country?.dialCode;
    const subscriberDigits = dialCode ? removeDialCode({ phone, dialCode }).trim() : '';
    // If no subscriber digits were typed (e.g. only dial code like +971), treat as empty
    const result = subscriberDigits ? phone : '';
    onChange?.(result);
  };

  return (
    <div className={`luxury-phone-input ${className}`}>
      <PhoneInput
        defaultCountry={defaultCountry}
        preferredCountries={preferredCountries}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        allowMaskOverflow={false}
        inputProps={{
          id,
          'aria-label': ariaLabel,
          maxLength: 25,
          autoComplete: 'tel',
          ...inputProps
        }}
        {...props}
      />
    </div>
  );
};

export default PhoneInputField;
