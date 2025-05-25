import React, { useState, useMemo } from 'react';
import { ProductDetails } from '../types';
import { DocumentTextIcon, PhotoIcon, PaperAirplaneIcon } from './icons';

interface ProductInputFormProps {
  onSubmit: (details: ProductDetails) => void;
}

const ProductInputForm: React.FC<ProductInputFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [originalDescription, setOriginalDescription] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>(['', '', '']);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !originalDescription.trim()) {
        alert("Product Name and Original Description are required.");
        return;
    }
    const filteredImageUrls = imageUrls.map(url => url.trim()).filter(url => url !== '');
    onSubmit({ name, originalDescription, originalImageUrls: filteredImageUrls });
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...imageUrls];
    newImageUrls[index] = value;
    setImageUrls(newImageUrls);
  };

  const descriptionCharCount = originalDescription.length;
  const descriptionWordCount = useMemo(() => {
    const words = originalDescription.trim().split(/\s+/);
    return words[0] === '' ? 0 : words.length;
  }, [originalDescription]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-2">
      <div>
        <label htmlFor="productName" className="block text-sm font-medium text-slate-300 mb-1">
          Product Name
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DocumentTextIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
            type="text"
            id="productName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md py-3"
            placeholder="e.g., Ergonomic Office Chair"
            aria-label="Product Name"
            />
        </div>
      </div>

      <div>
        <label htmlFor="originalDescription" className="block text-sm font-medium text-slate-300 mb-1">
          Current Product Description
        </label>
        <textarea
          id="originalDescription"
          value={originalDescription}
          onChange={(e) => setOriginalDescription(e.target.value)}
          rows={6}
          required
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md p-3"
          placeholder="Enter the current product description here..."
          aria-label="Current Product Description"
        />
        <div className="mt-1 text-xs text-slate-400 flex justify-end space-x-2" aria-live="polite">
            <span>Characters: {descriptionCharCount}</span>
            <span>|</span>
            <span>Words: {descriptionWordCount}</span>
        </div>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Current Product Image URLs (Optional)
        </label>
        {[0, 1, 2].map((index) => (
          <div key={index} className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <PhotoIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="url"
              placeholder={`Image URL ${index + 1} (e.g., https://picsum.photos/400/300?random=${index+1})`}
              value={imageUrls[index]}
              onChange={(e) => handleImageUrlChange(index, e.target.value)}
              className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border-slate-600 bg-slate-700 text-slate-100 rounded-md py-3"
              aria-label={`Product Image URL ${index + 1}`}
            />
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-indigo-500 transition-transform transform hover:scale-105"
      >
        <PaperAirplaneIcon className="w-5 h-5 mr-2 rotate-[-45deg]"/>
        Enhance Listing
      </button>
    </form>
  );
};

export default ProductInputForm;
