
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { Recipe, NutrientInfo } from '../types';
import Button from '../components/Button';
import { IconPlusCircle, IconSearch, IconEdit, IconTrash, IconBook } from '../components/Icon';
import Modal from '../components/Modal'; // For delete confirmation

const RecipeCard: React.FC<{ recipe: Recipe; onDelete: (id: string) => void }> = ({ recipe, onDelete }) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleDelete = () => {
    onDelete(recipe.id);
    setIsConfirmModalOpen(false);
  };
  
  const nutrientsPerServing: NutrientInfo = {
    Energia: recipe.Energia,
    Proteína: recipe.Proteína,
    Carboidrato: recipe.Carboidrato,
    Lipídeos: recipe.Lipídeos,
    Colesterol: recipe.Colesterol,
    FibraAlimentar: recipe.FibraAlimentar,
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 flex flex-col">
      <Link to={`/recipe/${recipe.id}`} className="block">
        <img 
          src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/400/300`} 
          alt={recipe.name} 
          className="w-full h-48 object-cover" 
          onError={(e) => (e.currentTarget.src = 'https://picsum.photos/400/300?grayscale')}
        />
      </Link>
      <div className="p-5 flex flex-col flex-grow">
        <Link to={`/recipe/${recipe.id}`}>
          <h3 className="text-xl font-semibold text-emerald-700 hover:text-emerald-800 mb-2 truncate" title={recipe.name}>{recipe.name}</h3>
        </Link>
        <p className="text-sm text-gray-500 mb-1">Porções: {recipe.servings}</p>
        <div className="text-xs text-gray-600 mb-3 space-y-0.5">
          <p>Energia: {nutrientsPerServing.Energia.toFixed(0)} Kcal</p>
          <p>Proteína: {nutrientsPerServing.Proteína.toFixed(1)} g</p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-grow">
          {recipe.instructions || "Instruções não fornecidas."}
        </p>
        <div className="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
          <Link to={`/recipe/${recipe.id}`}>
            <Button variant="ghost" size="sm">Ver Detalhes</Button>
          </Link>
          <div className="flex space-x-2">
            <Link to={`/manage-data?editRecipe=${recipe.id}`}>
              <Button variant="ghost" size="sm" aria-label="Editar Receita"><IconEdit /></Button>
            </Link>
            <Button variant="danger" size="sm" onClick={() => setIsConfirmModalOpen(true)} aria-label="Excluir Receita"><IconTrash /></Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <p>Tem certeza que deseja excluir a receita "{recipe.name}"? Esta ação não pode ser desfeita.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
};

const RecipeLibraryPage: React.FC = () => {
  const { recipes, deleteRecipe, ingredients } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIngredient, setFilterIngredient] = useState('');

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const nameMatch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
      const ingredientMatch = filterIngredient === '' || recipe.ingredients.some(ing => ing.ingredientId === filterIngredient);
      return nameMatch && ingredientMatch;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [recipes, searchTerm, filterIngredient]);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Biblioteca de Receitas</h1>
        <Link to="/manage-data?view=addRecipe">
          <Button variant="primary" size="lg" leftIcon={<IconPlusCircle />}>
            Adicionar Receita
          </Button>
        </Link>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
        <div className="flex-grow">
          <label htmlFor="recipeSearch" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar Receita
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconSearch />
            </div>
            <input
              type="text"
              id="recipeSearch"
              placeholder="Ex: Bolo de Cenoura, Frango Grelhado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="w-full md:w-auto">
          <label htmlFor="ingredientFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filtrar por Ingrediente Principal
          </label>
          <select
            id="ingredientFilter"
            value={filterIngredient}
            onChange={(e) => setFilterIngredient(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Todos os Ingredientes</option>
            {ingredients.map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconBook />
          <p className="mt-4 text-xl text-gray-600">Nenhuma receita encontrada.</p>
          {searchTerm || filterIngredient ? (
            <p className="text-gray-500 mt-2">Tente ajustar seus filtros ou termos de busca.</p>
          ) : (
            <p className="text-gray-500 mt-2">Adicione novas receitas para começar!</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onDelete={deleteRecipe} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecipeLibraryPage;
