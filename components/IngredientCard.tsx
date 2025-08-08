
import React from 'react';
import { Ingredient } from '../types';
import { IconBook } from './Icon'; // Using a generic icon as placeholder

interface IngredientCardProps {
  ingredient: Ingredient;
  viewMode: 'list' | 'mosaic';
  showImage: boolean;
  actions?: React.ReactNode;
}

const getCategoryColorStyle = (category: string = "Outros") => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; 
    }
    const colors = [
      'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 
      'bg-yellow-100 text-yellow-800', 'bg-purple-100 text-purple-800', 
      'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800', 'bg-teal-100 text-teal-800',
      'bg-orange-100 text-orange-800', 'bg-gray-200 text-gray-800'
    ];
    return colors[Math.abs(hash) % colors.length];
};

const IngredientCard: React.FC<IngredientCardProps> = ({ ingredient, viewMode, showImage, actions }) => {
  const hasImage = !!ingredient.image;

  if (viewMode === 'mosaic') {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 flex flex-col items-center p-3 text-center">
        <div className={`relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 mb-2 transition-all duration-300 ${!showImage && 'hidden'}`}>
          {hasImage ? (
            <img 
              src={ingredient.image}
              alt={`Foto do ingrediente: ${ingredient.name}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              onError={(e) => e.currentTarget.style.display = 'none'}
            />
          ) : (
             <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center">
                <IconBook className="w-10 h-10 text-slate-400" />
            </div>
          )}
        </div>
        <div className="flex-grow w-full">
            <p className="font-semibold text-sm text-slate-800 truncate" title={ingredient.name}>{ingredient.name}</p>
            <p className={`text-xs px-1.5 py-0.5 rounded-full inline-block mt-1 ${getCategoryColorStyle(ingredient.setor)}`}>
                {ingredient.setor || 'Outros'}
            </p>
        </div>
        {actions && <div className="mt-2 flex space-x-1">{actions}</div>}
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md overflow-hidden transition-all duration-300 flex items-center p-3 gap-3">
      <div className="flex-grow min-w-0">
        <p className="font-semibold text-slate-800 truncate" title={ingredient.name}>{ingredient.name}</p>
        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded-full inline-block ${getCategoryColorStyle(ingredient.setor)}`}>
                {ingredient.setor || 'Outros'}
            </span>
            <span>Unidade: {ingredient.unit}</span>
            {ingredient.brand && <span className="truncate">Marca: {ingredient.brand}</span>}
        </div>
      </div>
      {actions && <div className="flex-shrink-0 ml-2">{actions}</div>}
      {showImage && (
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300">
          {hasImage ? (
            <img 
              src={ingredient.image}
              alt={`Foto do ingrediente: ${ingredient.name}`}
              className="w-full h-full object-cover rounded-md"
              loading="lazy"
               onError={(e) => e.currentTarget.style.display = 'none'}
            />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-md flex items-center justify-center">
                <IconBook className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IngredientCard;
