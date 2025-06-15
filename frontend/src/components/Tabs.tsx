import React, { useState } from 'react';
import { Tab } from '@headlessui/react';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onChange,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState(
    defaultTab ? items.findIndex(item => item.id === defaultTab) : 0
  );

  const handleChange = (index: number) => {
    setSelectedIndex(index);
    onChange?.(items[index].id);
  };

  return (
    <Tab.Group selectedIndex={selectedIndex} onChange={handleChange}>
      <Tab.List className={`flex space-x-1 rounded-xl bg-gray-100 p-1 ${className}`}>
        {items.map(item => (
          <Tab
            key={item.id}
            className={({ selected }) => `
              w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2
              ${
                selected
                  ? 'bg-white text-primary-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
              }
            `}
          >
            {item.label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="mt-4">
        {items.map(item => (
          <Tab.Panel
            key={item.id}
            className={`
              rounded-xl bg-white p-3
              ring-white ring-opacity-60 ring-offset-2 ring-offset-primary-400 focus:outline-none focus:ring-2
            `}
          >
            {item.content}
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Tabs; 