'use client';

import { useState, useEffect } from 'react';
import type { CourseFilters as CourseFiltersType } from '@/types/courses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Download, Upload } from 'lucide-react';
import { COURSE_CATEGORIES, COURSE_TERMS, CLASS_LEVELS, ACADEMIC_STREAMS } from '@/types/courses';

interface CourseFiltersProps {
  filters: CourseFiltersType;
  onFiltersChange: (filters: CourseFiltersType) => void;
  onExport?: () => void;
  onImport?: () => void;
  showAdvancedFilters?: boolean;
  className?: string;
  studentMode?: boolean;
}

export function CourseFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onExport,
  onImport,
  showAdvancedFilters = true,
  className = '',
  studentMode = false
}: CourseFiltersProps) {
  const [localFilters, setLocalFilters] = useState<CourseFiltersType>({
    ...filters,
    class_level: filters.class_level || '__all__',
    term: filters.term || '__all__',
    category: filters.category || '__all__',
    stream: filters.stream || '__all__'
  });
  const [showFilters, setShowFilters] = useState(false);

  const cleanAndSend = (next: CourseFiltersType) => {
    const cleaned: Record<string, unknown> = { ...next };
    Object.keys(cleaned).forEach((k) => {
      const v = cleaned[k];
      if (v === undefined || v === '' || v === '__all__') {
        delete cleaned[k];
      }
    });
    onFiltersChange(cleaned as CourseFiltersType);
  };

  useEffect(() => {
    setLocalFilters({
      ...filters,
      class_level: filters.class_level || '__all__',
      term: filters.term || '__all__',
      category: filters.category || '__all__',
      stream: filters.stream || '__all__'
    });
  }, [filters]);

  const handleFilterChange = (key: keyof CourseFiltersType, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value };
    if (key === 'page') {
      newFilters.page = 1; // Reset to first page when filters change
    }
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    // Clean up filters - remove undefined values and __all__ values
    const cleanFilters = { ...localFilters } as Record<string, unknown>;
    Object.keys(cleanFilters).forEach(key => {
      const val = cleanFilters[key];
      if (val === undefined || val === '' || val === '__all__') {
        delete cleanFilters[key];
      }
    });
    onFiltersChange(cleanFilters as CourseFiltersType);
  };

  const clearFilters = () => {
    const clearedFilters: CourseFiltersType = {
      page: 1,
      limit: filters.limit
    };
    const resetLocalFilters = {
      ...clearedFilters,
      class_level: '__all__',
      term: '__all__',
      category: '__all__',
      stream: '__all__'
    };
    setLocalFilters(resetLocalFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    key !== 'page' && key !== 'limit' && (filters as Record<string, unknown>)[key]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Basic Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses by name, code, or description..."
            value={localFilters.search || ''}
            onChange={(e) => {
              handleFilterChange('search', e.target.value);
              // Apply search immediately
              const newFilters = { ...localFilters, search: e.target.value, page: 1 };
              cleanAndSend(newFilters);
            }}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(filters).filter(key => 
                  key !== 'page' && key !== 'limit' && (filters as Record<string, unknown>)[key]
                ).length}
              </Badge>
            )}
          </Button>
          
          {onExport && (
            <Button variant="outline" onClick={onExport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          )}
          
          {onImport && (
            <Button variant="outline" onClick={onImport} className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </Button>
          )}
        </div>
      </div>

      {/* Quick Filters Area */}
      {!studentMode && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!localFilters.class_level ? "default" : "outline"}
            size="sm"
            onClick={() => {
              handleFilterChange('class_level', undefined);
              const newFilters = { ...localFilters, class_level: undefined, page: 1 };
              cleanAndSend(newFilters);
            }}
            className="text-xs"
          >
            All Classes
          </Button>
          {CLASS_LEVELS.slice(0, 8).map((level) => (
            <Button
              key={level}
              variant={localFilters.class_level === level ? "default" : "outline"}
              size="sm"
              onClick={() => {
                handleFilterChange('class_level', level);
                const newFilters = { ...localFilters, class_level: level, page: 1 };
                cleanAndSend(newFilters);
              }}
              className="text-xs"
            >
              {level}
            </Button>
          ))}
          {CLASS_LEVELS.length > 8 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(true)}
              className="text-xs"
            >
              More...
            </Button>
          )}
        </div>
      )}

      {/* Minimal Term Filter for Students */}
      {studentMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Term</label>
            <Select
              value={localFilters.term || '__all__'}
              onValueChange={(value) => {
                handleFilterChange('term', value === '__all__' ? undefined : value);
                const newFilters = { ...localFilters, term: value === '__all__' ? undefined : value, page: 1 };
                cleanAndSend(newFilters);
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="__all__">All Terms</SelectItem>
                {COURSE_TERMS.map((term) => (
                  <SelectItem key={term} value={term}>
                    {term} Term
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      {showFilters && showAdvancedFilters && (
        <div className="border rounded-lg p-4 bg-gray-50" style={{ zIndex: 10 }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Class Level Filter */}
            {!studentMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Class Level</label>
              <Select
                value={localFilters.class_level || '__all__'}
                onValueChange={(value) => handleFilterChange('class_level', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="__all__">All Classes</SelectItem>
                  {CLASS_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            {/* Term Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Term</label>
              <Select
                value={localFilters.term || '__all__'}
                onValueChange={(value) => handleFilterChange('term', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="__all__">All Terms</SelectItem>
                  {COURSE_TERMS.map((term) => (
                    <SelectItem key={term} value={term}>
                      {term} Term
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            {!studentMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select
                value={localFilters.category || '__all__'}
                onValueChange={(value) => handleFilterChange('category', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="__all__">All Categories</SelectItem>
                  {COURSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}

            {/* Stream Filter */}
            {!studentMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Stream</label>
              <Select
                value={localFilters.stream || '__all__'}
                onValueChange={(value) => handleFilterChange('stream', value === '__all__' ? undefined : value)}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="All Streams" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="__all__">All Streams</SelectItem>
                  <SelectItem value="null">General</SelectItem>
                  {ACADEMIC_STREAMS.map((stream) => (
                    <SelectItem key={stream} value={stream}>
                      {stream}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (key === 'page' || key === 'limit' || !value) return null;
                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {key}: {value}
                      <button
                        onClick={() => {
                          handleFilterChange(key as keyof CourseFiltersType, undefined);
                          const newFilters = { ...localFilters, [key]: undefined, page: 1 };
                          onFiltersChange(newFilters);
                        }}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button onClick={applyFilters} className="flex-1">
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}



