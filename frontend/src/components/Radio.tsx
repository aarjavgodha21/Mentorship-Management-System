import React, { forwardRef } from 'react';

interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
            type="radio"
            className={`
              h-4 w-4 border-gray-300
              text-primary-600 focus:ring-primary-500
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

Radio.displayName = 'Radio';

export default Radio; 