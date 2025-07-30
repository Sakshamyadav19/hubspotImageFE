"use client";
import React from 'react';
import { Link, Image, CheckCircle2, Circle } from 'lucide-react';

type ColumnSelectorProps = {
  columns: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, selected, onChange }) => {
  const handleCheck = (col: string) => {
    if (selected.includes(col)) {
      onChange(selected.filter((c) => c !== col));
    } else {
      onChange([...selected, col]);
    }
  };

  const selectAll = () => {
    onChange(columns);
  };

  const clearAll = () => {
    onChange([]);
  };

  // Suggest likely image URL columns based on common naming patterns
  const getSuggestionLevel = (columnName: string): 'high' | 'medium' | 'low' => {
    const name = columnName.toLowerCase();
    const highConfidence = ['image', 'photo', 'picture', 'img', 'thumbnail', 'avatar', 'logo'];
    const mediumConfidence = ['url', 'link', 'src', 'asset', 'media'];
    
    if (highConfidence.some(keyword => name.includes(keyword))) return 'high';
    if (mediumConfidence.some(keyword => name.includes(keyword))) return 'medium';
    return 'low';
  };

  const sortColumnsBySuggestion = (columns: string[]) => {
    return [...columns].sort((a, b) => {
      const aLevel = getSuggestionLevel(a);
      const bLevel = getSuggestionLevel(b);
      const order = { high: 0, medium: 1, low: 2 };
      return order[aLevel] - order[bLevel];
    });
  };

  const sortedColumns = sortColumnsBySuggestion(columns);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select Image URL Columns
          </h3>
          <p className="text-gray-600 text-sm">
            Choose which columns contain image URLs that you want to download
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={selectAll}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
          >
            Select All
          </button>
          <button
            onClick={clearAll}
            className="text-gray-600 hover:text-gray-700 text-sm font-medium px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sortedColumns.map((col) => {
          const isSelected = selected.includes(col);
          const suggestion = getSuggestionLevel(col);
          
          return (
            <div
              key={col}
              className={`relative border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              onClick={() => handleCheck(col)}
            >
              {/* Suggestion Badge */}
              {suggestion !== 'low' && (
                <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-medium
                  ${suggestion === 'high' 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                  {suggestion === 'high' ? 'Recommended' : 'Suggested'}
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {isSelected ? (
                    <CheckCircle2 className="text-blue-600" size={20} />
                  ) : (
                    <Circle className="text-gray-400" size={20} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1.5 rounded-lg ${
                      suggestion === 'high' ? 'bg-green-100' :
                      suggestion === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      {suggestion !== 'low' ? (
                        <Image className={`${
                          suggestion === 'high' ? 'text-green-600' :
                          suggestion === 'medium' ? 'text-yellow-600' : ''
                        }`} size={16} />
                      ) : (
                        <Link className="text-gray-600" size={16} />
                      )}
                    </div>
                    <span className={`font-medium truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {col}
                    </span>
                  </div>
                  
                  <p className={`text-xs ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {suggestion === 'high' && 'Likely contains image URLs'}
                    {suggestion === 'medium' && 'May contain image URLs'}
                    {suggestion === 'low' && 'Column data'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {columns.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No columns available. Please upload a file first.</p>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="text-blue-600" size={20} />
              <span className="font-medium text-blue-900">
                {selected.length} column{selected.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="text-sm text-blue-700">
              Ready to download images
            </div>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            {selected.map((col) => (
              <span
                key={col}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
              >
                {col}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheck(col);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnSelector;