'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductFiltersProps {
  filters: {
    categoryType?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  onChange: (filters: any) => void;
  onClear: () => void;
}

const categoryOptions = [
  { value: 'groceries', label: 'Groceries' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home_essentials', label: 'Home Essentials' },
  { value: 'beauty', label: 'Beauty' },
  { value: 'accessories', label: 'Accessories' },
];

export function ProductFilters({ filters, onChange, onClear }: ProductFiltersProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Category</Label>
        <Select
          value={filters.categoryType || ''}
          onValueChange={(value) => onChange({ categoryType: value || undefined })}
        >
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categoryOptions.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Price Range</Label>
        <div className="flex items-center gap-2 mt-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => onChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-24"
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => onChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
            className="w-24"
          />
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={onClear} className="w-full">
        Clear Filters
      </Button>
    </div>
  );
}
