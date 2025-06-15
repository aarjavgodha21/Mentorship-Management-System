import React, { useState } from 'react';
import { UseFormRegister, FieldErrors, FieldValues, Path } from 'react-hook-form';
import { EyeSlashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface PasswordInputProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  name: Path<T>;
  errors: FieldErrors<T>;
  label: string;
  placeholder: string;
  showStrength?: boolean;
  watch?: (name: Path<T>) => string;
  disabled?: boolean;
}

const PasswordInput = <T extends FieldValues>({
  register,
  name,
  errors,
  label,
  placeholder,
  showStrength = false,
  watch,
  disabled = false
}: PasswordInputProps<T>) => {
  const [showPassword, setShowPassword] = useState(false);
  const password = watch ? watch(name) : '';

  const getPasswordStrength = (currentPassword: string) => {
    let score = 0;
    if (currentPassword.length >= 8) score++;
    if (/[A-Z]/.test(currentPassword)) score++;
    if (/[0-9]/.test(currentPassword)) score++;
    if (/[^A-Za-z0-9]/.test(currentPassword)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
  const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong'];

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1 relative">
        <input
          {...register(name, {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters'
            }
          })}
          type={showPassword ? 'text' : 'password'}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          disabled={disabled}
        >
          {showPassword ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-400" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-400" />
          )}
        </button>
      </div>
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]?.message as string}</p>
      )}
      {showStrength && password && (
        <div className="mt-2">
          <div className="flex space-x-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-1 w-full rounded-full ${
                  i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className={`mt-1 text-sm ${strengthColors[strength - 1].replace('bg-', 'text-')}`}>
            {strengthText[strength - 1]}
          </p>
        </div>
      )}
    </div>
  );
};

export default PasswordInput; 