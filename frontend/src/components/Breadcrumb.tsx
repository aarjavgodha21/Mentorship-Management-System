import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHomeIcon = true,
  className = ''
}) => {
  return (
    <nav className={className}>
      <ol className="flex items-center space-x-2">
        {showHomeIcon && (
          <li>
            <Link
              to="/"
              className="text-gray-400 hover:text-gray-500"
            >
              <HomeIcon className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </li>
        )}
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon
                className="h-5 w-5 flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className={`
                  ml-2 text-sm font-medium
                  ${index === items.length - 1
                    ? 'text-gray-500'
                    : 'text-gray-400 hover:text-gray-500'
                  }
                `}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`
                  ml-2 text-sm font-medium
                  ${index === items.length - 1
                    ? 'text-gray-500'
                    : 'text-gray-400'
                  }
                `}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb; 