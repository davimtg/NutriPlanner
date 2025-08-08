import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Recipe } from '../types';
import Button from './Button';
import Modal from './Modal';
import { IconEdit, IconTrash, IconBook } from './Icon';

interface RecipeItemProps {
  recipe: Recipe;
  viewMode: 'list' | 'mosaic';
  showImage: boolean;
  onDelete: (id: string) => void;
}

const RecipeItem: React.FC<RecipeItemProps> = ({ recipe, viewMode, showImage, onDelete }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleDelete = () => {
    onDelete(recipe.id);
    setIsConfirmModalOpen(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    target.onerror = null; // prevent infinite loop
    target.src = 'https://picsum.photos/400?grayscale';
  };
  
  const modal = (
    <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <p className="text-slate-700">Tem certeza que deseja excluir a receita "{recipe.name}"? Esta ação não pode ser desfeita.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
  );

  if (viewMode === 'mosaic') {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 flex flex-col text-center group">
        <Link to={`/recipe/${recipe.id}`} className="block">
            <div className="relative w-full aspect-square bg-slate-100">
                 {showImage ? (
                    (recipe.imageUrl ? 
                        <img
                            src={recipe.imageUrl} 
                            alt={`Foto da receita: ${recipe.name}`} 
                            className="w-full h-full object-cover" 
                            loading="lazy"
                            onError={handleError}
                        /> :
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                            <IconBook className="w-12 h-12 text-slate-400" />
                        </div>
                    )
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                        <IconBook className="w-12 h-12 text-slate-400" />
                    </div>
                )}
            </div>
        </Link>
        <div className="p-3 flex-grow flex flex-col justify-between">
            <div>
                <Link to={`/recipe/${recipe.id}`}>
                    <h3 className="font-semibold text-slate-800 hover:text-emerald-700 transition-colors truncate" title={recipe.name}>
                        {recipe.name}
                    </h3>
                </Link>
                <div className="text-xs text-slate-500 mt-1">
                    <span>{recipe.prepTime || 'N/A'}</span>
                    <span className="mx-1.5">•</span>
                    <span className="capitalize">{recipe.difficulty || 'N/A'}</span>
                </div>
            </div>
            <div className="mt-3 flex justify-center space-x-1.5">
                <Link to={`/manage-data?editRecipe=${recipe.id}`} title="Editar Receita">
                    <Button variant="ghost" size="sm" aria-label="Editar Receita"><IconEdit /></Button>
                </Link>
                <Button variant="danger" size="sm" onClick={() => setIsConfirmModalOpen(true)} aria-label="Excluir Receita" title="Excluir Receita">
                    <IconTrash />
                </Button>
            </div>
        </div>
        {modal}
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden transition-all duration-300 flex items-center p-4 gap-4">
      {showImage && (
        <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 transition-all duration-300">
           <img 
            src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/200`}
            key={recipe.imageUrl || recipe.id} // force re-render if URL changes, helps with onError logic
            alt={`Foto da receita: ${recipe.name}`} 
            className="w-full h-full object-cover rounded-lg bg-slate-100" 
            loading="lazy"
            onError={handleError}
          />
        </div>
      )}
      <div className="flex-grow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 min-w-0">
        <div className="flex-grow min-w-0">
          <Link to={`/recipe/${recipe.id}`}>
            <h3 className="text-lg font-semibold text-emerald-700 hover:text-emerald-800 transition-colors truncate" title={recipe.name}>
              {recipe.name}
            </h3>
          </Link>
          <div className="flex items-center text-xs text-slate-500 mt-1 flex-wrap">
            <span>{recipe.servings} porções</span>
            {recipe.prepTime && <span className="mx-1.5">•</span>}
            {recipe.prepTime && <span>{recipe.prepTime}</span>}
            {recipe.difficulty && <span className="mx-1.5">•</span>}
            {recipe.difficulty && <span className="capitalize">{recipe.difficulty}</span>}
          </div>
          <p className="text-xs text-slate-600 mt-1">
            <span className="font-medium">Energia:</span> {recipe.Energia.toFixed(0)} Kcal/porção
          </p>
        </div>
        <div className="flex space-x-1.5 self-start sm:self-center flex-shrink-0">
          <Link to={`/manage-data?editRecipe=${recipe.id}`} title="Editar Receita">
            <Button variant="ghost" size="sm" aria-label="Editar Receita"><IconEdit /></Button>
          </Link>
          <Button variant="danger" size="sm" onClick={() => setIsConfirmModalOpen(true)} aria-label="Excluir Receita" title="Excluir Receita">
            <IconTrash />
          </Button>
        </div>
      </div>
      {modal}
    </div>
  );
};

export default RecipeItem;