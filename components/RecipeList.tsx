import React from 'react';
import { Recipe } from '../types';
import RecipeItem from './RecipeItem';
import usePersistentState from '../hooks/usePersistentState';
import ToggleSwitch from './ToggleSwitch';
import { IconLayoutGrid, IconList, IconPhoto, IconPhotoOff } from './Icon';

interface RecipeListProps {
  recipes: Recipe[];
  onDelete: (id: string) => void;
}

const RecipeList: React.FC<RecipeListProps> = ({ recipes, onDelete }) => {
  const [viewMode, setViewMode] = usePersistentState<'list' | 'mosaic'>('recipes_viewMode', 'list');
  const [showImages, setShowImages] = usePersistentState<boolean>('recipes_showImages', true);

  const containerClasses = viewMode === 'list'
    ? "space-y-3"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4";

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
        <div className="flex items-center gap-2" title={showImages ? "Ocultar fotos das receitas" : "Mostrar fotos das receitas"}>
            {showImages ? <IconPhoto className="text-slate-600" /> : <IconPhotoOff className="text-slate-500" />}
            <ToggleSwitch
                id="recipe-show-images-toggle"
                checked={showImages}
                onChange={setShowImages}
                label="Mostrar Fotos"
            />
        </div>
      </div>
      
      <div className={containerClasses}>
        {recipes.map(recipe => (
          <RecipeItem 
            key={recipe.id} 
            recipe={recipe} 
            viewMode={viewMode}
            showImage={showImages}
            onDelete={onDelete} 
          />
        ))}
      </div>
    </div>
  );
};

export default RecipeList;