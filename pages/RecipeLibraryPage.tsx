
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import Button from '../components/Button';
import { IconPlusCircle, IconSearch, IconBook, IconFilter } from '../components/Icon';
import RecipeList from '../components/RecipeList'; // New Component

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
        <h1 className="text-4xl font-bold text-slate-800">Biblioteca de Receitas</h1>
        <Link to="/manage-data?view=addRecipe">
          <Button variant="primary" size="lg" leftIcon={<IconPlusCircle />}>
            Adicionar Receita
          </Button>
        </Link>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:items-end md:gap-4">
        <div className="flex-grow">
          <label htmlFor="recipeSearch" className="block text-sm font-medium text-slate-700 mb-1">
            <IconSearch className="inline-block mr-1 w-4 h-4 align-middle" /> Buscar Receita
          </label>
          <div className="relative">
            <input
              type="text"
              id="recipeSearch"
              placeholder="Ex: Bolo de Cenoura, Frango Grelhado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <IconSearch />
            </div>
          </div>
        </div>
        <div className="w-full md:w-auto md:min-w-[200px]">
          <label htmlFor="ingredientFilter" className="block text-sm font-medium text-slate-700 mb-1">
             <IconFilter className="inline-block mr-1 w-4 h-4 align-middle" /> Filtrar por Ingrediente
          </label>
          <select
            id="ingredientFilter"
            value={filterIngredient}
            onChange={(e) => setFilterIngredient(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
          >
            <option value="">Todos os Ingredientes</option>
            {ingredients.sort((a,b) => a.name.localeCompare(b.name)).map(ing => (
              <option key={ing.id} value={ing.id}>{ing.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
          <IconBook className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="mt-4 text-xl text-slate-600">Nenhuma receita encontrada.</p>
          {searchTerm || filterIngredient ? (
            <p className="text-slate-500 mt-2">Tente ajustar seus filtros ou termos de busca.</p>
          ) : (
            <p className="text-slate-500 mt-2">Adicione novas receitas para começar!</p>
          )}
        </div>
      ) : (
        <RecipeList recipes={filteredRecipes} onDelete={deleteRecipe} />
      )}
    </div>
  );
};

export default RecipeLibraryPage;
