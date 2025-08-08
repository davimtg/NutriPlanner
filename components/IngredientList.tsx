
import React from 'react';
import { Ingredient } from '../types';
import IngredientCard from './IngredientCard';
import usePersistentState from '../hooks/usePersistentState';
import ToggleSwitch from './ToggleSwitch';
import { IconLayoutGrid, IconList, IconPhoto, IconPhotoOff } from './Icon';

interface IngredientListProps {
  ingredients: Ingredient[];
  renderActions?: (ingredient: Ingredient) => React.ReactNode;
}

const IngredientList: React.FC<IngredientListProps> = ({ ingredients, renderActions }) => {
  const [viewMode, setViewMode] = usePersistentState<'list' | 'mosaic'>('ingredients_viewMode', 'list');
  const [showImages, setShowImages] = usePersistentState<boolean>('ingredients_showImages', true);

  const containerClasses = viewMode === 'list'
    ? "space-y-2"
    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-3 bg-slate-50 rounded-lg border">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
            aria-pressed={viewMode === 'list'}
            title="Visualização em Lista"
          >
            <IconList /> Lista
          </button>
          <button
            onClick={() => setViewMode('mosaic')}
            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${viewMode === 'mosaic' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-600 hover:bg-slate-300'}`}
            aria-pressed={viewMode === 'mosaic'}
            title="Visualização em Mosaico"
          >
            <IconLayoutGrid /> Mosaico
          </button>
        </div>
        
        {/* Show Images Toggle */}
        <div className="flex items-center gap-2" title={showImages ? "Ocultar fotos dos ingredientes" : "Mostrar fotos dos ingredientes"}>
            {showImages ? <IconPhoto className="text-slate-600" /> : <IconPhotoOff className="text-slate-500" />}
            <ToggleSwitch
                id="ingredient-show-images-toggle"
                checked={showImages}
                onChange={setShowImages}
                label="Mostrar Fotos"
            />
        </div>
      </div>
      
      <div className={containerClasses}>
        {ingredients.map(ingredient => (
          <IngredientCard 
            key={ingredient.id} 
            ingredient={ingredient} 
            viewMode={viewMode}
            showImage={showImages}
            actions={renderActions ? renderActions(ingredient) : undefined} 
          />
        ))}
      </div>
    </div>
  );
};

export default IngredientList;
