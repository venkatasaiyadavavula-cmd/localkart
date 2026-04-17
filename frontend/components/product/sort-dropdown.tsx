'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SortDropdownProps {
  value: { sortBy: string; sortOrder: 'ASC' | 'DESC' };
  onChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
}

const sortOptions = [
  { value: 'createdAt-DESC', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'DESC' },
  { value: 'price-ASC', label: 'Price: Low to High', sortBy: 'price', sortOrder: 'ASC' },
  { value: 'price-DESC', label: 'Price: High to Low', sortBy: 'price', sortOrder: 'DESC' },
  { value: 'rating-DESC', label: 'Top Rated', sortBy: 'rating', sortOrder: 'DESC' },
  { value: 'orderCount-DESC', label: 'Most Popular', sortBy: 'orderCount', sortOrder: 'DESC' },
];

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const currentValue = `${value.sortBy}-${value.sortOrder}`;

  const handleChange = (val: string) => {
    const option = sortOptions.find((opt) => opt.value === val);
    if (option) {
      onChange(option.sortBy, option.sortOrder as 'ASC' | 'DESC');
    }
  };

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {sortOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
