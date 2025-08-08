
import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { DailyPlan, Meal, NutrientInfo, Ingredient, Recipe } from '../types';
import { IconCalendar, IconBook, IconPlusCircle, IconShoppingCart, IconEdit, IconSparkles, IconCalculator, IconHistory, IconSettings } from '../components/Icon'; // Added missing icons
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO } from '../constants';
import Button from '../components/Button';
import NutrientDonutChart from '../components/NutrientDonutChart'; 

const MealCard: React.FC<{ meal: Meal, date: string }> = ({ meal, date }) => {
  const { getIngredientById, getRecipeById } = useData();

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-emerald-700">{meal.mealType}</h3>
        <Link to={`/planner?date=${date}#meal-${encodeURIComponent(meal.mealType)}`}>
          <Button variant="ghost" size="sm" leftIcon={<IconEdit />}>Editar</Button>
        </Link>
      </div>
      {meal.items.length === 0 ? (
        <p className="text-slate-500 italic text-sm">Nenhum item planejado.</p>
      ) : (
        <ul className="space-y-2.5">
          {meal.items.map(item => {
            const details = item.type === 'ingredient' ? getIngredientById(item.itemId) : getRecipeById(item.itemId);
            const name = item.customName || details?.name || 'Item desconhecido';
            const quantityUnit = item.type === 'ingredient' ? `${item.quantity} ${(details as Ingredient)?.unit || ''}` : `${item.quantity} porç${item.quantity > 1 ? 'ões' : 'ão'}`;
            return (
              <li key={item.id} className="text-slate-700 text-sm pb-1 border-b border-slate-100 last:border-b-0">
                <span className="font-medium">{name}</span> - {quantityUnit}
              </li>
            );
          })}
        </ul>
      )}
      {meal.totalNutrients && meal.items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
           <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs text-slate-600">
                <p><strong className="text-emerald-600">E:</strong> {meal.totalNutrients.Energia.toFixed(0)}</p>
                <p><strong className="text-blue-600">P:</strong> {meal.totalNutrients.Proteína.toFixed(1)}</p>
                <p><strong className="text-orange-600">C:</strong> {meal.totalNutrients.Carboidrato.toFixed(1)}</p>
                <p><strong className="text-red-600">L:</strong> {meal.totalNutrients.Lipídeos.toFixed(1)}</p>
                <p><strong className="text-indigo-600">Col:</strong> {meal.totalNutrients.Colesterol.toFixed(0)}</p>
                <p><strong className="text-purple-600">Fib:</strong> {meal.totalNutrients.FibraAlimentar.toFixed(1)}</p>
           </div>
        </div>
      )}
    </div>
  );
};

const QuickActionCard: React.FC<{label: string; to: string; icon: React.ReactNode;}> = ({ label, to, icon }) => {
  return (
    <Link 
      to={to}
      className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center group"
    >
      <span className="text-3xl mb-2 text-emerald-500 group-hover:text-emerald-600 transition-colors">{icon}</span>
      <span className="font-medium text-slate-700 group-hover:text-emerald-700 transition-colors text-sm">{label}</span>
    </Link>
  );
};


const DashboardPage: React.FC = () => {
  const { getDailyPlan, globalTargetNutrients } = useData();
  const today = new Date().toISOString().split('T')[0];
  const [currentDate, setCurrentDate] = React.useState(today);
  
  const dailyPlan = getDailyPlan(currentDate) || { date: currentDate, meals: MEAL_TYPES_ORDERED.map(mt => ({ mealType: mt, items: [], totalNutrients: {...DEFAULT_NUTRIENT_INFO} })), totalNutrients: {...DEFAULT_NUTRIENT_INFO} };

  const quickActions = [
    { label: 'Planejar Dia/Semana', to: '/planner', icon: <IconCalendar /> },
    { label: 'Biblioteca de Receitas', to: '/recipes', icon: <IconBook /> },
    { label: 'Sugestões da IA', to: '/smart-recipe', icon: <IconSparkles /> },
    { label: 'Lista de Compras', to: '/shopping-list', icon: <IconShoppingCart /> },
    { label: 'Calculadoras', to: '/calculators', icon: <IconCalculator /> },
    { label: 'Gerenciar Dados', to: '/manage-data', icon: <IconPlusCircle /> },
    { label: 'Histórico de Dietas', to: '/diet-history', icon: <IconHistory /> },
    { label: 'Configurações do Plano', to: '/plan-settings', icon: <IconSettings /> },
  ];

  const nutrientsForDashboard: Array<{ key: keyof NutrientInfo; label: string; unit: string; colorClass: string }> = [
    { key: 'Energia', label: 'Energia', unit: 'Kcal', colorClass: 'stroke-emerald-500 text-emerald-500' },
    { key: 'Proteína', label: 'Proteína', unit: 'g', colorClass: 'stroke-blue-500 text-blue-500' },
    { key: 'Carboidrato', label: 'Carboidrato', unit: 'g', colorClass: 'stroke-orange-500 text-orange-500' },
    { key: 'Lipídeos', label: 'Lipídeos', unit: 'g', colorClass: 'stroke-red-500 text-red-500' },
  ];


  return (
    <div className="space-y-8">
      <header className="text-center md:text-left">
        <h1 className="text-4xl font-bold text-slate-800">Bem-vindo(a) ao <span className="text-emerald-600">NutriPlanner</span>!</h1>
        <p className="text-lg text-slate-600 mt-2">Seu painel de controle para uma alimentação saudável e organizada.</p>
      </header>

      <section className="bg-slate-100 p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <QuickActionCard key={action.label} label={action.label} to={action.to} icon={action.icon} />
          ))}
        </div>
      </section>
      
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
            <h2 className="text-3xl font-semibold text-slate-800">Resumo do Dia</h2>
            <input 
                type="date" 
                value={currentDate} 
                onChange={(e) => setCurrentDate(e.target.value)}
                className="p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                aria-label="Selecionar data para visualização"
            />
        </div>
        <p className="text-sm text-slate-500 mb-4 -mt-4">Visualizando: {new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>


        {dailyPlan.totalNutrients && (
          <div className="mb-8 bg-white p-5 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-slate-700 mb-4 text-center">Consumo Diário vs. Metas</h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {nutrientsForDashboard.map(nutrient => (
                <NutrientDonutChart
                  key={nutrient.key}
                  nutrientKey={nutrient.key}
                  label={nutrient.label}
                  consumed={dailyPlan.totalNutrients ? dailyPlan.totalNutrients[nutrient.key] : 0}
                  target={globalTargetNutrients[nutrient.key]}
                  unit={nutrient.unit}
                  colorClass={nutrient.colorClass}
                />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1">
                <p><strong className="text-indigo-600">Colesterol:</strong> {dailyPlan.totalNutrients.Colesterol.toFixed(0)} mg / {globalTargetNutrients.Colesterol.toFixed(0)} mg (Meta)</p>
                <p><strong className="text-purple-600">Fibra Alimentar:</strong> {dailyPlan.totalNutrients.FibraAlimentar.toFixed(1)} g / {globalTargetNutrients.FibraAlimentar.toFixed(1)} g (Meta)</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dailyPlan.meals.map(meal => (
            <MealCard key={meal.mealType} meal={meal} date={currentDate} />
          ))}
        </div>
        {dailyPlan.meals.every(m => m.items.length === 0) && (
             <div className="text-center py-10 bg-white rounded-xl shadow-lg mt-6">
                <IconCalendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-xl text-slate-500 mb-4">Nenhuma refeição planejada para {new Date(currentDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}.</p>
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