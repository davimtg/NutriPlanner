
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { DailyPlan, Meal, NutrientInfo, Ingredient, Recipe } from '../types';
import { IconCalendar, IconBook, IconPlusCircle, IconShoppingCart, IconEdit } from '../components/Icon';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO } from '../constants';
import Button from '../components/Button';

const NutrientDisplay: React.FC<{ nutrients: NutrientInfo, title?: string }> = ({ nutrients, title }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    {title && <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-sm">
      <p><strong className="text-emerald-600">Energia:</strong> {nutrients.Energia.toFixed(0)} Kcal</p>
      <p><strong className="text-blue-600">Proteína:</strong> {nutrients.Proteína.toFixed(1)} g</p>
      <p><strong className="text-orange-600">Carboidrato:</strong> {nutrients.Carboidrato.toFixed(1)} g</p>
      <p><strong className="text-red-600">Lipídeos:</strong> {nutrients.Lipídeos.toFixed(1)} g</p>
      <p><strong className="text-indigo-600">Colesterol:</strong> {nutrients.Colesterol.toFixed(0)} mg</p>
      <p><strong className="text-purple-600">Fibra Alimentar:</strong> {nutrients.FibraAlimentar.toFixed(1)} g</p>
    </div>
  </div>
);

const MealCard: React.FC<{ meal: Meal, date: string }> = ({ meal, date }) => {
  const { getIngredientById, getRecipeById } = useData();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-emerald-700">{meal.mealType}</h3>
        <Link to={`/planner?date=${date}`}>
          <Button variant="ghost" size="sm" leftIcon={<IconEdit />}>Editar</Button>
        </Link>
      </div>
      {meal.items.length === 0 ? (
        <p className="text-gray-500 italic">Nenhum item planejado.</p>
      ) : (
        <ul className="space-y-2">
          {meal.items.map(item => {
            const details = item.type === 'ingredient' ? getIngredientById(item.itemId) : getRecipeById(item.itemId);
            const name = item.customName || details?.name || 'Item desconhecido';
            const quantityUnit = item.type === 'ingredient' ? `${item.quantity} ${(details as Ingredient)?.unit || ''}` : `${item.quantity} porç${item.quantity > 1 ? 'ões' : 'ão'}`;
            return (
              <li key={item.id} className="text-gray-700 text-sm">
                <span className="font-medium">{name}</span> - {quantityUnit}
              </li>
            );
          })}
        </ul>
      )}
      {meal.totalNutrients && (
        <div className="mt-4 pt-3 border-t border-gray-200">
           <NutrientDisplay nutrients={meal.totalNutrients} />
        </div>
      )}
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const { getDailyPlan } = useData();
  const today = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = React.useState(today);
  
  const dailyPlan = getDailyPlan(currentDate) || { date: currentDate, meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [], totalNutrients: {...DEFAULT_NUTRIENT_INFO} })), totalNutrients: {...DEFAULT_NUTRIENT_INFO} };

  const quickActions = [
    { label: 'Planejar Semana', to: '/planner', icon: <IconCalendar />, color: 'bg-emerald-500 hover:bg-emerald-600' },
    { label: 'Ver Receitas', to: '/recipes', icon: <IconBook />, color: 'bg-blue-500 hover:bg-blue-600' },
    { label: 'Adicionar Dados', to: '/manage-data', icon: <IconPlusCircle />, color: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: 'Lista de Compras', to: '/shopping-list', icon: <IconShoppingCart />, color: 'bg-purple-500 hover:bg-purple-600' },
  ];

  return (
    <div className="space-y-8">
      <header className="text-center md:text-left">
        <h1 className="text-4xl font-bold text-gray-800">Bem-vindo(a) ao <span className="text-emerald-600">NutriPlanner</span>!</h1>
        <p className="text-lg text-gray-600 mt-2">Seu painel de controle para uma alimentação saudável e organizada.</p>
      </header>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <Link key={action.label} to={action.to}
              className={`flex flex-col items-center justify-center p-6 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 ${action.color}`}
            >
              <span className="text-3xl mb-2">{action.icon}</span>
              {action.label}
            </Link>
          ))}
        </div>
      </section>
      
      <section>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-semibold text-gray-800">Plano de Hoje <span className="text-lg text-gray-500">({new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})</span></h2>
            <input 
                type="date" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)}
                className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
        </div>

        {dailyPlan.totalNutrients && (
          <div className="mb-6">
            <NutrientDisplay nutrients={dailyPlan.totalNutrients} title="Resumo Nutricional do Dia" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dailyPlan.meals.map(meal => (
            <MealCard key={meal.mealType} meal={meal} date={currentDate} />
          ))}
        </div>
        {dailyPlan.meals.every(m => m.items.length === 0) && (
             <div className="text-center py-10 bg-white rounded-lg shadow">
                <p className="text-xl text-gray-500 mb-4">Nenhuma refeição planejada para hoje.</p>
                <Link to={`/planner?date=${currentDate}`}>
                    <Button variant="primary" size="lg">Planejar Refeições</Button>
                </Link>
            </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
