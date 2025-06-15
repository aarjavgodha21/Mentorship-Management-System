import React, { forwardRef } from 'react';

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      error,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div className="relative flex items-start">
        <div className="flex h-6 items-center">
          <input
            ref={ref}
            type="checkbox"
            className={`
              h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
              transition-colors duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${props.checked ? 'bg-primary-600' : 'bg-gray-200'}
              ${error ? 'border-red-300' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${props.id}-error` : undefined}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          {label && (
            <label
              htmlFor={props.id}
              className={`
                font-medium
                ${error ? 'text-red-600' : 'text-gray-700'}
              `}
            >
              {label}
            </label>
          )}
          {error && (
            <p
              className="mt-2 text-sm text-red-600"
              id={`${props.id}-error`}
            >
              {error}
            </p>
          )}
          {helperText && !error && (
            <p className="mt-2 text-sm text-gray-500">{helperText}</p>
          )}
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch; 