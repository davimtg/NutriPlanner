
import { MealType, NutrientInfo, Recipe } from './types';

export const APP_NAME = "NutriPlanner";

export const MEAL_TYPES_ORDERED: MealType[] = [
  MealType.Breakfast,
  MealType.SnackManha,
  MealType.Lunch,
  MealType.SnackTarde,
  MealType.Dinner,
  MealType.Ceia,
  MealType.Snack, // General snack if others are not used
];

export const DEFAULT_NUTRIENT_INFO: NutrientInfo = {
  Energia: 0,
  Proteína: 0,
  Carboidrato: 0,
  Lipídeos: 0,
  Colesterol: 0,
  FibraAlimentar: 0,
};

export const UNITS_OF_MEASUREMENT = [
  { value: 'g', label: 'Gramas (g)' },
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: 'ml', label: 'Mililitros (ml)' },
  { value: 'l', label: 'Litros (l)' },
  { value: 'unidade', label: 'Unidade(s)' },
  { value: 'xícara', label: 'Xícara(s)' },
  { value: 'colher de sopa', label: 'Colher(es) de Sopa' },
  { value: 'colher de chá', label: 'Colher(es) de Chá' },
  { value: 'fatia', label: 'Fatia(s)' },
  { value: 'pedaço', label: 'Pedaço(s)' },
  { value: 'a gosto', label: 'A gosto' },
  { value: '100g', label: '100 Gramas (100g)'},
  { value: '100ml', label: '100 Mililitros (100ml)'},
  { value: 'porção', label: 'Porção(ões)'}, // Added for recipes from AI
  { value: 'pitada', label: 'Pitada(s)'},
];

export const CSV_INGREDIENT_HEADERS = ['nome', 'unidade', 'setor', 'marca', 'energia_kcal', 'proteina_g', 'carboidrato_g', 'lipideos_g', 'colesterol_mg', 'fibra_alimentar_g', 'preco_medio', 'local_compra', 'link_imagem'];
export const CSV_RECIPE_HEADERS = ['nome', 'modo_preparo', 'ingredientes', 'porcoes', 'tempo_preparo', 'dificuldade', 'link_imagem'];

// New CSV Headers for Diet Plan
export const CSV_DIET_PLAN_HEADERS = [
  'date', 
  'mealType', 
  'itemType', 
  'itemId', 
  'itemName', 
  'quantity', 
  'unit', 
  'customName',
  'energia_kcal',
  'proteina_g',
  'carboidrato_g',
  'lipideos_g',
  'colesterol_mg',
  'fibra_alimentar_g'
];

export const PLACEHOLDER_IMAGE_URL = 'https://picsum.photos/400/300';
export const RECIPE_DIFFICULTY_LEVELS: Array<Recipe['difficulty']> = ['Fácil', 'Médio', 'Difícil'];

// For Nutritional Calculators
export const ACTIVITY_LEVEL_OPTIONS: Array<{value: string, label: string, multiplier: number}> = [
  { value: 'sedentary', label: 'Sedentário (pouco ou nenhum exercício)', multiplier: 1.2 },
  { value: 'light', label: 'Leve (exercício leve 1-3 dias/semana)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderado (exercício moderado 3-5 dias/semana)', multiplier: 1.55 },
  { value: 'active', label: 'Ativo (exercício intenso 6-7 dias/semana)', multiplier: 1.725 },
  { value: 'veryActive', label: 'Muito Ativo (exercício muito intenso, trabalho físico)', multiplier: 1.9 },
];

export const GOAL_OPTIONS: Array<{value: string, label: string, adjustment: number}> = [
   { value: 'lose_extreme', label: 'Perder Peso Rápido (-750 Kcal)', adjustment: -750 },
   { value: 'lose', label: 'Perder Peso (-500 Kcal)', adjustment: -500 },
   { value: 'lose_mild', label: 'Perder Peso Leve (-250 Kcal)', adjustment: -250 },
   { value: 'maintain', label: 'Manter Peso', adjustment: 0 },
   { value: 'gain_mild', label: 'Ganhar Peso Leve (+250 Kcal)', adjustment: 250 },
   { value: 'gain', label: 'Ganhar Peso (+500 Kcal)', adjustment: 500 },
];

// Default macro split: 40% Carbs, 30% Protein, 30% Fat
export const DEFAULT_MACRO_PERCENTAGES = { protein: 0.30, carbs: 0.40, fat: 0.30 };
