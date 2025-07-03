import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SKUSearchProps {
  onSearch: (sku: string) => void;
}

export function SKUSearch({ onSearch }: SKUSearchProps) {
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    onSearch(searchValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setSearchValue('');
      onSearch('');
    }
  };

  return (
    <div>
      <h3 className="text-sm font-medium mb-3 text-[hsl(0,0%,88.2%)]">SKU Search</h3>
      <div className="relative">
        <Input
          type="text"
          placeholder="Enter SKU (e.g. ABC123)"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-[hsl(0,0%,17.6%)] border-gray-600 text-[hsl(0,0%,88.2%)] focus:border-[hsl(207,90%,54%)]"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSearch}
          className="absolute right-2 top-2 text-[hsl(0,0%,70.2%)] hover:text-[hsl(207,90%,54%)] p-1"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 text-xs text-[hsl(0,0%,70.2%)]">
        Press Enter to search, ESC to clear
      </div>
    </div>
  );
}
