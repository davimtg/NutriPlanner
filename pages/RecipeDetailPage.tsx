
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { Recipe, Ingredient, NutrientInfo } from '../types';
import Button from '../components/Button';
import { IconEdit, IconTrash, IconCalendar } from '../components/Icon';
import Modal from '../components/Modal';

const NutrientTable: React.FC<{ nutrients: NutrientInfo, title: string, basis: string }> = ({ nutrients, title, basis }) => (
  <div className="bg-gray-50 p-4 rounded-lg shadow">
    <h4 className="text-md font-semibold text-gray-700 mb-2">{title} <span className="text-xs text-gray-500">({basis})</span></h4>
    <ul className="text-sm space-y-1">
      <li><strong>Energia:</strong> {nutrients.Energia.toFixed(0)} Kcal</li>
      <li><strong>Proteína:</strong> {nutrients.Proteína.toFixed(1)} g</li>
      <li><strong>Carboidrato:</strong> {nutrients.Carboidrato.toFixed(1)} g</li>
      <li><strong>Lipídeos:</strong> {nutrients.Lipídeos.toFixed(1)} g</li>
      <li><strong>Colesterol:</strong> {nutrients.Colesterol.toFixed(0)} mg</li>
      <li><strong>Fibra Alimentar:</strong> {nutrients.FibraAlimentar.toFixed(1)} g</li>
    </ul>
  </div>
);


const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getRecipeById, getIngredientById, deleteRecipe } = useData();
  const navigate = useNavigate();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);

  const recipe = id ? getRecipeById(id) : undefined;

  if (!recipe) {
    return (
      <div className="text-center p-10">
        <h2 className="text-2xl font-semibold text-gray-700">Receita não encontrada.</h2>
        <Link to="/recipes">
          <Button variant="primary" className="mt-4">Voltar para Biblioteca</Button>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (recipe) {
      deleteRecipe(recipe.id);
      navigate('/recipes');
    }
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
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-bold text-emerald-700">{recipe.name}</h1>
        <div className="flex space-x-2">
            <Link to={`/planner?addRecipeId=${recipe.id}`}>
                <Button variant="primary" leftIcon={<IconCalendar />}>Adicionar ao Plano</Button>
            </Link>
            <Link to={`/manage-data?editRecipe=${recipe.id}`}>
                <Button variant="ghost" leftIcon={<IconEdit />}>Editar</Button>
            </Link>
            <Button variant="danger" onClick={() => setIsConfirmModalOpen(true)} leftIcon={<IconTrash />}>Excluir</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="md:col-span-1">
          <img 
            src={recipe.imageUrl || `https://picsum.photos/seed/${recipe.id}/600/400`} 
            alt={recipe.name} 
            className="w-full h-auto object-cover rounded-lg shadow-md"
            onError={(e) => (e.currentTarget.src = 'https://picsum.photos/600/400?grayscale')}
          />
        </div>
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Ingredientes</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700 bg-gray-50 p-4 rounded-md">
              {recipe.ingredients.map((item, index) => {
                const ingredient = getIngredientById(item.ingredientId);
                return (
                  <li key={index}>
                    {item.quantity} {ingredient?.unit || ''} de {ingredient?.name || 'Ingrediente desconhecido'}
                  </li>
                );
              })}
            </ul>
            <p className="text-sm text-gray-600 mt-2">Rendimento: {recipe.servings} porç{recipe.servings > 1 ? 'ões' : 'ão'}</p>
          </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <NutrientTable nutrients={nutrientsPerServing} title="Nutrientes" basis="por porção"/>
             {recipe.totalNutrients && <NutrientTable nutrients={recipe.totalNutrients} title="Nutrientes Totais" basis="receita completa"/>}
           </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Modo de Preparo</h3>
        <div className="prose prose-emerald max-w-none text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md">
          {recipe.instructions || <p className="italic">Instruções não fornecidas.</p>}
        </div>
      </div>
      
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <p>Tem certeza que deseja excluir a receita "{recipe.name}"? Esta ação não pode ser desfeita e irá removê-la de quaisquer planos de refeição existentes.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
};

export default RecipeDetailPage;
