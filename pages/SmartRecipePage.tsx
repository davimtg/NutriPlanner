

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { useData } from '../hooks/useData';
import { Ingredient, RecipeIngredient as AppRecipeIngredient, MealType, RecipeDifficulty, NutrientInfo, AiGeneratedDailyPlan } from '../types';
import Button from '../components/Button';
import { IconLightbulb, IconBook, IconSave, IconChevronDown, IconCalendar, IconChevronUp, IconX, IconSearch } from '../components/Icon'; // Updated Icons
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL, RECIPE_DIFFICULTY_LEVELS, UNITS_OF_MEASUREMENT } from '../constants';
import { useGlobalToast } from '../App';
import { generateId } from '../utils/idGenerator';
import Modal from '../components/Modal';


// Gemini specific types for RECIPE generation
interface GeminiRecipeIngredient {
  name: string;
  quantity: number | string; 
  unit: string;
}

interface GeminiSuggestedRecipe {
  name: string;
  prepTime: string;
  difficulty: RecipeDifficulty;
  description: string;
  ingredients: GeminiRecipeIngredient[];
  instructions: string;
}

// Gemini specific types for DIET PLAN generation are within AiGeneratedDailyPlan from types.ts

const SmartRecipePage: React.FC = () => {
  const { ingredients: userIngredients, addIngredient, getIngredientById, addRecipe, globalTargetNutrients, addAiGeneratedDietPlan } = useData();
  const { addToast } = useGlobalToast();

  const [generationMode, setGenerationMode] = useState<'recipe' | 'dietPlan'>('recipe');
  
  // Recipe generation state
  const [recipeIngredientSearch, setRecipeIngredientSearch] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipeMealType, setRecipeMealType] = useState<MealType | ''>('');
  const [recipePreferences, setRecipePreferences] = useState('');
  const [suggestedRecipes, setSuggestedRecipes] = useState<GeminiSuggestedRecipe[]>([]);
  const [savedRecipeNames, setSavedRecipeNames] = useState<string[]>([]);

  // Diet plan generation state
  const [planIngredientSearch, setPlanIngredientSearch] = useState('');
  const [planDuration, setPlanDuration] = useState<number>(3); // days
  const [planTargetCalories, setPlanTargetCalories] = useState<number>(globalTargetNutrients.Energia || 2000);
  const [planTargetProtein, setPlanTargetProtein] = useState<number | ''>(globalTargetNutrients.Proteína || '');
  const [planTargetCarbs, setPlanTargetCarbs] = useState<number | ''>(globalTargetNutrients.Carboidrato || '');
  const [planTargetFat, setPlanTargetFat] = useState<number | ''>(globalTargetNutrients.Lipídeos || '');
  const [planMealsPerDay, setPlanMealsPerDay] = useState<number>(3);
  const [planPreferences, setPlanPreferences] = useState('');
  const [planPrioritizeIngredients, setPlanPrioritizeIngredients] = useState<string[]>([]);
  const [planGoal, setPlanGoal] = useState<string>('');
  const [suggestedDietPlan, setSuggestedDietPlan] = useState<AiGeneratedDailyPlan[]>([]);
  const [isPlanSaved, setIsPlanSaved] = useState(false);
  const [expandedPlanDay, setExpandedPlanDay] = useState<number | null>(null);
  const [planStartDate, setPlanStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState(false);


  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ai, setAi] = useState<GoogleGenAI | null>(null);

   useEffect(() => {
    setPlanTargetCalories(globalTargetNutrients.Energia || 2000);
    setPlanTargetProtein(globalTargetNutrients.Proteína || '');
    setPlanTargetCarbs(globalTargetNutrients.Carboidrato || '');
    setPlanTargetFat(globalTargetNutrients.Lipídeos || '');
  }, [globalTargetNutrients]);


  useEffect(() => {
    if (process.env.API_KEY) {
      try {
        setAi(new GoogleGenAI({ apiKey: process.env.API_KEY }));
      } catch (e) {
        console.error("Failed to initialize GoogleGenAI:", e);
        const errorMessage = "Falha ao inicializar o serviço de IA. Verifique a configuração da API KEY ou se ela é válida.";
        setError(errorMessage);
        addToast(errorMessage, "error", 10000);
      }
    } else {
      const errorMessage = "API KEY do Gemini não configurada. Esta funcionalidade requer uma API KEY válida.";
      setError(errorMessage);
      addToast(errorMessage, "error", 10000);
    }
  }, [addToast]);


  const handleSelectIngredient = (ingredientId: string, listType: 'recipe' | 'plan') => {
    const stateSetter = listType === 'recipe' ? setSelectedIngredients : setPlanPrioritizeIngredients;
    const currentList = listType === 'recipe' ? selectedIngredients : planPrioritizeIngredients;
    const maxLength = listType === 'recipe' ? 3 : 5;

    stateSetter(prev => {
      if (prev.includes(ingredientId)) { // Should not happen if adding from search, but good for removal
        return prev.filter(id => id !== ingredientId);
      }
      if (prev.length < maxLength) {
        return [...prev, ingredientId];
      }
      addToast(`Você pode selecionar no máximo ${maxLength} ingredientes para ${listType === 'recipe' ? 'a receita' : 'priorizar no plano'}.`, "warning");
      return prev;
    });
    if (listType === 'recipe') setRecipeIngredientSearch(''); else setPlanIngredientSearch('');
  };
  
  const handleRemoveSelectedIngredient = (ingredientId: string, listType: 'recipe' | 'plan') => {
    const stateSetter = listType === 'recipe' ? setSelectedIngredients : setPlanPrioritizeIngredients;
    stateSetter(prev => prev.filter(id => id !== ingredientId));
  };


  const parseGeminiQuantity = (quantityStr: number | string): number => {
    if (typeof quantityStr === 'number') return quantityStr > 0 ? quantityStr : 1;
    if (typeof quantityStr === 'string') {
      const cleanedStr = quantityStr.toLowerCase().trim();
      const commonNonNumeric = ['a gosto', 'to taste', 'pitada', 'as needed', 'q.b.'];
      if (commonNonNumeric.some(term => cleanedStr.includes(term))) return 1;
      
      const fractionMatch = cleanedStr.match(/^(\d+)\s*\/\s*(\d+)$/); // e.g., "1/2", "3/4"
      if (fractionMatch) {
          const num = parseInt(fractionMatch[1], 10);
          const den = parseInt(fractionMatch[2], 10);
          if (den > 0) return num / den;
      }
      
      const rangeMatch = cleanedStr.match(/(\d+(\.\d+)?)\s*-\s*(\d+(\.\d+)?)/); // e.g. "1-2", "0.5-1"
      if (rangeMatch && rangeMatch[1]) {
          const parsed = parseFloat(rangeMatch[1]);
          return parsed > 0 ? parsed : 1; // Use the lower end of the range
      }

      const numberMatch = cleanedStr.match(/(\d+(\.\d+)?)/); // General number match
      if (numberMatch && numberMatch[1]) {
        const parsed = parseFloat(numberMatch[1]);
        return parsed > 0 ? parsed : 1;
      }
    }
    return 1; 
  };
  
  const normalizeUnit = (unitStr: string): string => {
    if (!unitStr || typeof unitStr !== 'string') return 'unidade';
    const lowerUnit = unitStr.toLowerCase().trim().replace(/[()]/g, ''); // Remove parentheses
    
    const exactMatch = UNITS_OF_MEASUREMENT.find(uom => uom.value.toLowerCase() === lowerUnit);
    if (exactMatch) return exactMatch.value;

    const labelMatch = UNITS_OF_MEASUREMENT.find(uom => uom.label.toLowerCase().includes(lowerUnit));
    if (labelMatch) return labelMatch.value;
    
    const pluralMatch = UNITS_OF_MEASUREMENT.find(uom => (uom.value + 's').toLowerCase() === lowerUnit || (uom.value + 'es').toLowerCase() === lowerUnit);
    if (pluralMatch) return pluralMatch.value;

    const commonVariations: Record<string, string> = {
      'gram': 'g', 'grams': 'g',
      'milliliter': 'ml', 'milliliters': 'ml',
      'tablespoon': 'colher de sopa', 'colheres de sopa': 'colher de sopa', 'tbsp': 'colher de sopa',
      'teaspoon': 'colher de chá', 'colheres de chá': 'colher de chá', 'tsp': 'colher de chá',
      'cup': 'xícara', 'xícaras': 'xícara',
      'unit': 'unidade', 'units': 'unidade',
      'slice': 'fatia', 'fatias': 'fatia',
      'piece': 'pedaço', 'pedaços': 'pedaço',
      'to taste': 'a gosto', 'q.b.': 'a gosto', 'as needed': 'a gosto',
      'portion': 'porção', 'porções': 'porção', 'serving': 'porção'
    };
    if (commonVariations[lowerUnit]) return commonVariations[lowerUnit];
    
    return 'unidade'; // Fallback
  };

  const generateRecipePrompt = (): string => {
    const ingredientNames = selectedIngredients.map(id => getIngredientById(id)?.name).filter(Boolean).join(', ');
    return `
      Você é um assistente de culinária especialista em criar receitas deliciosas e práticas.
      Sugira 1 a 3 receitas com base nos seguintes critérios.
      Ingredientes disponíveis que DEVEM ser usados (pelo menos um deles): ${ingredientNames}.
      ${recipeMealType ? `Tipo de refeição desejado: ${recipeMealType}.` : ''}
      ${recipePreferences ? `Preferências adicionais (como tipo de cozinha, restrições alimentares, etc.): ${recipePreferences}.` : ''}
      Por favor, retorne sua resposta como um array JSON. Cada objeto no array deve representar uma receita e ter EXATAMENTE a seguinte estrutura:
      {
        "name": "string (nome da receita)",
        "prepTime": "string (ex: '30 min', '1 hora e 15 minutos')",
        "difficulty": "Fácil" | "Médio" | "Difícil",
        "description": "string (breve descrição do porquê esta receita é uma boa sugestão, até 50 palavras)",
        "ingredients": [
          { "name": "string (nome do ingrediente)", "quantity": number_or_string_parsable_to_number (ex: 1, 0.5, "1/2", "1-2"), "unit": "string (ex: 'g', 'xícara', 'unidade', 'colher de sopa')" }
        ],
        "instructions": "string (instruções claras, divididas em passos, usando '\\\\n' para novas linhas entre os passos)"
      }
      Certifique-se de que a resposta seja APENAS o array JSON, sem nenhum texto ou formatação markdown (como \`\`\`json) ao redor.
      Se não conseguir encontrar receitas adequadas com os ingredientes fornecidos, retorne um array JSON vazio [].
      Para "quantity" nos ingredientes, se for algo como "a gosto" ou um intervalo, use uma representação numérica (ex: 1 para "a gosto", ou o menor valor do intervalo como "1" para "1-2") e ajuste a unidade se necessário (ex: "a gosto").
      A lista de ingredientes deve incluir TODOS os ingredientes necessários para a receita, não apenas os fornecidos.
    `;
  };
  
  const generateDietPlanPrompt = (): string => {
    const prioIngredientNames = planPrioritizeIngredients.map(id => getIngredientById(id)?.name).filter(Boolean).join(', ');
    const allKnownMealTypes = MEAL_TYPES_ORDERED.join(', ');
    let mealDistributionInstruction = '';

    if (planMealsPerDay === 1) {
      mealDistributionInstruction = `O plano deve ter 1 refeição principal por dia. Escolha um tipo de refeição apropriado (ex: Almoço ou Jantar) a partir dos tipos conhecidos: ${allKnownMealTypes}.`;
    } else if (planMealsPerDay === 2) {
      mealDistributionInstruction = `O plano deve ter 2 refeições principais por dia. Distribua-as sensatamente (ex: Café da Manhã e Almoço, ou Almoço e Jantar) usando os tipos conhecidos: ${allKnownMealTypes}.`;
    } else if (planMealsPerDay === 3) {
      mealDistributionInstruction = `O plano deve ter 3 refeições principais por dia (Café da Manhã, Almoço e Jantar) usando os tipos conhecidos: ${allKnownMealTypes}.`;
    } else if (planMealsPerDay === 4) {
      mealDistributionInstruction = `O plano deve ter 4 refeições por dia. Distribua-as sensatamente, incluindo refeições principais e lanches (ex: Café da Manhã, Almoço, Lanche da Tarde, Jantar) usando os tipos conhecidos: ${allKnownMealTypes}.`;
    } else { // 5 or more
      mealDistributionInstruction = `O plano deve ter ${planMealsPerDay} refeições por dia. Distribua-as sensatamente ao longo do dia, incluindo refeições principais e lanches, conforme apropriado, usando os tipos conhecidos: ${allKnownMealTypes}.`;
    }

    return `
      Você é um planejador de dietas profissional e nutricionista.
      Crie um plano de dieta detalhado para ${planDuration} dias.
      O plano deve visar aproximadamente ${planTargetCalories} calorias por dia.
      ${planTargetProtein ? `Proteína alvo: ${planTargetProtein}g. ` : ''}
      ${planTargetCarbs ? `Carboidratos alvo: ${planTargetCarbs}g. ` : ''}
      ${planTargetFat ? `Gorduras alvo: ${planTargetFat}g. ` : ''}
      ${mealDistributionInstruction}
      Preferências/Restrições: ${planPreferences || 'Nenhuma preferência específica.'}
      ${prioIngredientNames ? `Priorize o uso destes ingredientes, se possível: ${prioIngredientNames}.` : ''}
      ${planGoal ? `Objetivo principal da dieta: ${planGoal}.` : ''}

      Retorne sua resposta como um array JSON. Cada objeto no array representa um dia e deve ter a seguinte estrutura:
      {
        "day": número (ex: 1),
        "summary": "string (breve resumo do dia, até 30 palavras)",
        "estimatedTotalNutrients": { "Energia": número, "Proteína": número, "Carboidrato": número, "Lipídeos": número },
        "meals": [
          {
            "mealType": "string (use um dos tipos de refeição de ${allKnownMealTypes}, conforme a distribuição instruída para as ${planMealsPerDay} refeições diárias)",
            "description": "string (sugestão de prato/refeição, até 40 palavras)",
            "items": [
              { "name": "string (nome do alimento)", "quantity": number_or_string_convertible_para_número, "unit": "string (unidade comum: g, ml, unidade, fatia, xícara, colher de sopa)" }
            ],
            "estimatedMealNutrients": { "Energia": número, "Proteína": número, "Carboidrato": número, "Lipídeos": número }
          }
        ]
      }
      Instruções para o JSON:
      - Responda APENAS com o array JSON, SEM TEXTO OU MARKDOWN adicional.
      - Se "quantity" for "a gosto" ou intervalo (ex: "1-2"), use um número representativo (ex: 1 para "a gosto", ou o menor valor "1" para "1-2").
      - Unidades ("unit") devem ser comuns (g, ml, unidade, fatia, xícara, colher de sopa, porção).
      - \`estimatedMealNutrients\` deve se aproximar de \`estimatedTotalNutrients\` para o dia. Os campos de nutrientes DEVEM ser "Energia", "Proteína", "Carboidrato", "Lipídeos".
      - Se não puder criar um plano, retorne [].
      - Priorize alimentos integrais e saudáveis.
    `;
  };

  const getSuggestions = async () => {
    if (!ai) {
      setError("Serviço de IA não inicializado."); addToast("Serviço de IA não está pronto.", "error"); return;
    }
    if (generationMode === 'recipe' && selectedIngredients.length === 0) {
      addToast("Por favor, selecione pelo menos um ingrediente para gerar receitas.", "warning"); return;
    }

    setIsLoading(true); setError(null); 
    if (generationMode === 'recipe') setSuggestedRecipes([]); else setSuggestedDietPlan([]);
    setIsPlanSaved(false);

    const prompt = generationMode === 'recipe' ? generateRecipePrompt() : generateDietPlanPrompt();

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } } 
      });
      
      let jsonStr = response.text.trim();
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) jsonStr = match[2].trim();
      
      const parsedResult = JSON.parse(jsonStr);
      
      if (!Array.isArray(parsedResult)) throw new Error("A resposta da IA não é um array válido.");
      
      if (generationMode === 'recipe') {
        (parsedResult as GeminiSuggestedRecipe[]).forEach(recipe => {
          if (!recipe.name || !Array.isArray(recipe.ingredients) || !recipe.instructions || !recipe.description) {
            throw new Error(`Estrutura da receita "${recipe.name || 'Desconhecida'}" inválida.`);
          }
        });
        setSuggestedRecipes(parsedResult as GeminiSuggestedRecipe[]);
        if (parsedResult.length === 0) addToast("Nenhuma sugestão de receita encontrada.", "info");
      } else { 
         (parsedResult as AiGeneratedDailyPlan[]).forEach(day => {
            if (typeof day.day !== 'number' || !Array.isArray(day.meals)) {
                throw new Error(`Estrutura do plano para o dia ${day.day || 'desconhecido'} inválida.`);
            }
            day.meals.forEach(meal => {
                if(!meal.mealType || !Array.isArray(meal.items)) {
                    throw new Error(`Estrutura da refeição ${meal.mealType || 'desconhecida'} inválida no dia ${day.day}.`);
                }
            });
        });
        setSuggestedDietPlan(parsedResult as AiGeneratedDailyPlan[]);
        if (parsedResult.length === 0) addToast("Nenhum plano de dieta sugerido.", "info");
      }

    } catch (e) {
      console.error("Error fetching or parsing suggestions:", e);
      const errMessage = `Erro ao buscar sugestões: ${(e as Error).message}. Verifique o console. Tente novamente.`;
      setError(errMessage);
      addToast(errMessage, "error", 10000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (geminiRecipe: GeminiSuggestedRecipe) => {
    const recipeAppIngredients: AppRecipeIngredient[] = [];
    let errorDuringSave = false;

    for (const geminiIng of geminiRecipe.ingredients) {
      let appIngredient = userIngredients.find(ing => ing.name.toLowerCase() === geminiIng.name.toLowerCase());
      if (!appIngredient) {
        const unitToSave = normalizeUnit(geminiIng.unit);
        try {
          appIngredient = addIngredient({ name: geminiIng.name, unit: unitToSave, setor: 'Importado IA (Receita)', ...DEFAULT_NUTRIENT_INFO });
          addToast(`Novo ingrediente "${geminiIng.name}" (${unitToSave}) adicionado. Revise os dados.`, "info", 7000);
        } catch (e) {
          addToast(`Erro ao adicionar novo ingrediente "${geminiIng.name}": ${(e as Error).message}`, "error");
          errorDuringSave = true; break; 
        }
      }
      recipeAppIngredients.push({ ingredientId: appIngredient.id, quantity: parseGeminiQuantity(geminiIng.quantity) });
    }

    if (errorDuringSave) { addToast("Não foi possível salvar a receita.", "error"); return; }

    try {
      const savedRecipe = addRecipe({
        name: geminiRecipe.name,
        instructions: geminiRecipe.instructions,
        servings: 2, 
        ingredients: recipeAppIngredients,
        imageUrl: `${PLACEHOLDER_IMAGE_URL}?text=${encodeURIComponent(geminiRecipe.name)}&id=${generateId()}`,
        prepTime: geminiRecipe.prepTime,
        difficulty: RECIPE_DIFFICULTY_LEVELS.includes(geminiRecipe.difficulty) ? geminiRecipe.difficulty : 'Médio',
      });
      addToast(`Receita "${savedRecipe.name}" salva!`, "success");
      setSavedRecipeNames(prev => [...prev, geminiRecipe.name]);
    } catch (e) { addToast(`Erro ao salvar receita: ${(e as Error).message}`, "error"); }
  };

  const handleSaveDietPlan = async () => {
    if (suggestedDietPlan.length === 0) {
      addToast("Nenhum plano de dieta para salvar.", "warning");
      return;
    }
    setIsLoading(true);
    try {
      await addAiGeneratedDietPlan(suggestedDietPlan, planStartDate); 
      addToast("Plano de dieta gerado pela IA foi adicionado ao seu planejador!", "success", 7000);
      setIsPlanSaved(true);
      setIsSavePlanModalOpen(false);
    } catch (e) {
      addToast(`Erro ao salvar plano de dieta: ${(e as Error).message}`, "error", 10000);
    } finally {
      setIsLoading(false);
    }
  };


  const filteredRecipeSearchIngredients = useMemo(() => {
    if (!recipeIngredientSearch.trim()) return [];
    return userIngredients
      .filter(ing => ing.name.toLowerCase().includes(recipeIngredientSearch.toLowerCase()) && !selectedIngredients.includes(ing.id))
      .slice(0, 5); // Show top 5 results
  }, [userIngredients, recipeIngredientSearch, selectedIngredients]);

  const filteredPlanSearchIngredients = useMemo(() => {
    if (!planIngredientSearch.trim()) return [];
    return userIngredients
      .filter(ing => ing.name.toLowerCase().includes(planIngredientSearch.toLowerCase()) && !planPrioritizeIngredients.includes(ing.id))
      .slice(0, 5);
  }, [userIngredients, planIngredientSearch, planPrioritizeIngredients]);


  const renderRecipeInputs = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="ingredient-search-recipe" className="block text-sm font-medium text-gray-700 mb-1">Buscar e adicionar até 3 ingredientes:</label>
        <div className="relative">
            <input 
                type="text" 
                id="ingredient-search-recipe" 
                value={recipeIngredientSearch} 
                onChange={(e) => setRecipeIngredientSearch(e.target.value)}
                placeholder="Digite o nome do ingrediente..."
                className="w-full p-2 pl-8 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                disabled={selectedIngredients.length >= 3}
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
              <IconSearch />
            </div>
        </div>
        {recipeIngredientSearch && filteredRecipeSearchIngredients.length > 0 && (
            <ul className="border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                {filteredRecipeSearchIngredients.map(ing => (
                    <li key={ing.id} onClick={() => handleSelectIngredient(ing.id, 'recipe')}
                        className="p-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700">
                        {ing.name}
                    </li>
                ))}
            </ul>
        )}
        {selectedIngredients.length > 0 && (
            <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">Selecionados ({selectedIngredients.length}/3):</p>
                <div className="flex flex-wrap gap-2">
                {selectedIngredients.map(id => {
                    const ing = getIngredientById(id);
                    return ing ? (
                    <span key={id} className="flex items-center bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                        {ing.name}
                        <button onClick={() => handleRemoveSelectedIngredient(id, 'recipe')} className="ml-1.5 text-emerald-500 hover:text-emerald-700">
                        <IconX />
                        </button>
                    </span>
                    ) : null;
                })}
                </div>
            </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="recipeMealType" className="block text-sm font-medium text-gray-700">Tipo de Refeição (Opcional)</label>
          <select id="recipeMealType" value={recipeMealType} onChange={(e) => setRecipeMealType(e.target.value as MealType | '')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
            <option value="">Qualquer</option>
            {MEAL_TYPES_ORDERED.map(mt => <option key={mt} value={mt}>{mt}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="recipePreferences" className="block text-sm font-medium text-gray-700">Preferências Adicionais (Opcional)</label>
          <input type="text" id="recipePreferences" value={recipePreferences} onChange={(e) => setRecipePreferences(e.target.value)} placeholder="Ex: Italiana, vegetariana, rápida" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
      </div>
    </div>
  );

  const renderDietPlanInputs = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
            <label htmlFor="planDuration" className="block text-sm font-medium text-gray-700">Duração do Plano (dias)</label>
            <input type="number" id="planDuration" value={planDuration} onChange={(e) => setPlanDuration(Math.max(1, parseInt(e.target.value)))} min="1" max="14" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="planTargetCalories" className="block text-sm font-medium text-gray-700">Calorias Diárias Alvo</label>
            <input type="number" id="planTargetCalories" value={planTargetCalories} onChange={(e) => setPlanTargetCalories(parseInt(e.target.value))} min="1000" step="50" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
         <div>
            <label htmlFor="planMealsPerDay" className="block text-sm font-medium text-gray-700">Refeições por Dia</label>
            <select id="planMealsPerDay" value={planMealsPerDay} onChange={(e) => setPlanMealsPerDay(parseInt(e.target.value))}className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                {[1,2,3,4,5,6,7].map(num => <option key={num} value={num}>{num} refeição(ões)</option>)}
            </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div>
            <label htmlFor="planTargetProtein" className="block text-sm font-medium text-gray-700">Proteína Alvo (g, opcional)</label>
            <input type="number" id="planTargetProtein" value={planTargetProtein} onChange={(e) => setPlanTargetProtein(e.target.value === '' ? '' : parseInt(e.target.value))} min="0" step="5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="planTargetCarbs" className="block text-sm font-medium text-gray-700">Carboidratos Alvo (g, opcional)</label>
            <input type="number" id="planTargetCarbs" value={planTargetCarbs} onChange={(e) => setPlanTargetCarbs(e.target.value === '' ? '' : parseInt(e.target.value))} min="0" step="5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
        <div>
            <label htmlFor="planTargetFat" className="block text-sm font-medium text-gray-700">Gorduras Alvo (g, opcional)</label>
            <input type="number" id="planTargetFat" value={planTargetFat} onChange={(e) => setPlanTargetFat(e.target.value === '' ? '' : parseInt(e.target.value))} min="0" step="5" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
        </div>
      </div>
       <div>
        <label htmlFor="ingredient-search-plan" className="block text-sm font-medium text-gray-700 mb-1">Buscar e priorizar até 5 ingredientes:</label>
         <div className="relative">
            <input 
                type="text" 
                id="ingredient-search-plan" 
                value={planIngredientSearch} 
                onChange={(e) => setPlanIngredientSearch(e.target.value)}
                placeholder="Digite o nome do ingrediente para priorizar..."
                className="w-full p-2 pl-8 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                disabled={planPrioritizeIngredients.length >= 5}
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400">
              <IconSearch />
            </div>
        </div>
        {planIngredientSearch && filteredPlanSearchIngredients.length > 0 && (
            <ul className="border border-gray-200 rounded-md mt-1 max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                {filteredPlanSearchIngredients.map(ing => (
                    <li key={ing.id} onClick={() => handleSelectIngredient(ing.id, 'plan')}
                        className="p-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700">
                        {ing.name}
                    </li>
                ))}
            </ul>
        )}
         {planPrioritizeIngredients.length > 0 && (
            <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">Priorizados ({planPrioritizeIngredients.length}/5):</p>
                <div className="flex flex-wrap gap-2">
                {planPrioritizeIngredients.map(id => {
                    const ing = getIngredientById(id);
                    return ing ? (
                    <span key={id} className="flex items-center bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                        {ing.name}
                        <button onClick={() => handleRemoveSelectedIngredient(id, 'plan')} className="ml-1.5 text-emerald-500 hover:text-emerald-700">
                            <IconX />
                        </button>
                    </span>
                    ) : null;
                })}
                </div>
            </div>
        )}
      </div>
      <div>
        <label htmlFor="planPreferences" className="block text-sm font-medium text-gray-700">Preferências/Restrições Adicionais</label>
        <textarea id="planPreferences" value={planPreferences} onChange={(e) => setPlanPreferences(e.target.value)} placeholder="Ex: vegetariano, sem glúten, baixo IG, comida caseira" rows={2} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
      <div>
        <label htmlFor="planGoal" className="block text-sm font-medium text-gray-700">Objetivo Principal da Dieta (Opcional)</label>
        <input type="text" id="planGoal" value={planGoal} onChange={(e) => setPlanGoal(e.target.value)} placeholder="Ex: Perda de peso, ganho de massa, manutenção" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <IconLightbulb className="w-10 h-10 text-emerald-600" />
        <h1 className="text-4xl font-bold text-gray-800">Sugestões Inteligentes</h1>
      </header>

      {!ai && error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
            <p className="font-semibold">Erro de Configuração</p><p>{error}</p>
        </div>
      )}

      {ai && (
        <>
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    <button onClick={() => setGenerationMode('recipe')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${generationMode === 'recipe' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Sugerir Receitas
                    </button>
                    <button onClick={() => setGenerationMode('dietPlan')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-medium text-sm ${generationMode === 'dietPlan' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Sugerir Plano de Dieta
                    </button>
                </nav>
            </div>

            {generationMode === 'recipe' ? renderRecipeInputs() : renderDietPlanInputs()}
            
            <div className="mt-6">
                <Button onClick={getSuggestions} disabled={isLoading || (generationMode === 'recipe' && selectedIngredients.length === 0) || !ai} leftIcon={<IconLightbulb />} className="w-full md:w-auto">
                {isLoading ? 'Buscando...' : (generationMode === 'recipe' ? 'Obter Sugestões de Receitas' : 'Gerar Plano de Dieta')}
                </Button>
                {!ai && <p className="text-xs text-red-500 mt-1">Serviço de IA indisponível.</p>}
            </div>
        </div>

        {isLoading && (
          <div className="text-center py-10" aria-live="polite" aria-busy="true">
            <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-emerald-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-label="Loading...">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Carregando...</span>
            </div>
            <p className="mt-2 text-gray-600">Aguarde, a IA está trabalhando...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
            <p className="font-semibold">Ocorreu um erro:</p><p>{error}</p>
          </div>
        )}

        {/* Display Suggested Recipes */}
        {!isLoading && generationMode === 'recipe' && suggestedRecipes.length > 0 && (
          <section className="space-y-6" aria-live="polite">
            <h2 className="text-2xl font-semibold text-gray-700">Receitas Sugeridas ({suggestedRecipes.length})</h2>
            {suggestedRecipes.map((recipe, index) => (
              <div key={`recipe-${index}`} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-bold text-emerald-700 mb-2">{recipe.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                  <span><strong>Preparo:</strong> {recipe.prepTime}</span>
                  <span><strong>Dificuldade:</strong> {recipe.difficulty}</span>
                </div>
                <p className="text-sm text-gray-700 mb-3 italic bg-emerald-50 p-3 rounded-md border border-emerald-200">{recipe.description}</p>
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-1">Ingredientes:</h4>
                  <ul className="list-disc list-inside pl-4 text-sm text-gray-700 space-y-0.5">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className={selectedIngredients.some(selId => getIngredientById(selId)?.name.toLowerCase() === ing.name.toLowerCase()) ? 'font-bold text-emerald-600' : ''}>
                        {ing.name}: {parseGeminiQuantity(ing.quantity)} {ing.unit}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-1">Instruções:</h4>
                  <div className="whitespace-pre-line text-sm text-gray-700 bg-gray-50 p-3 rounded-md border border-gray-200 prose prose-sm max-w-none">
                    {recipe.instructions.split(/\\n|\n/).map((step, stepIdx) => <p key={stepIdx}>{step.replace(/^\d+\.\s*/, '')}</p>)}
                  </div>
                </div>
                <Button onClick={() => handleSaveRecipe(recipe)} disabled={savedRecipeNames.includes(recipe.name)} leftIcon={<IconSave />}
                    aria-label={savedRecipeNames.includes(recipe.name) ? `Receita ${recipe.name} já salva` : `Salvar receita ${recipe.name}`}>
                  {savedRecipeNames.includes(recipe.name) ? 'Já Salva!' : 'Salvar na Biblioteca'}
                </Button>
              </div>
            ))}
          </section>
        )}
        {!isLoading && generationMode === 'recipe' && suggestedRecipes.length === 0 && selectedIngredients.length > 0 && (
            <div className="text-center py-10 bg-white rounded-lg shadow" aria-live="polite">
                <IconBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Nenhuma sugestão de receita encontrada.</p>
                <p className="text-gray-500 mt-2">Tente alterar os ingredientes ou as preferências.</p>
            </div>
        )}
        
        {/* Display Suggested Diet Plan */}
        {!isLoading && generationMode === 'dietPlan' && suggestedDietPlan.length > 0 && (
            <section className="space-y-6" aria-live="polite">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-700">Plano de Dieta Sugerido ({suggestedDietPlan.length} dia(s))</h2>
                    <Button onClick={() => setIsSavePlanModalOpen(true)} disabled={isPlanSaved} leftIcon={<IconSave />}>
                        {isPlanSaved ? "Plano Salvo!" : "Salvar Plano no Planejador"}
                    </Button>
                </div>
                {suggestedDietPlan.map((dayPlan) => (
                    <div key={dayPlan.day} className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-emerald-700 mb-2">Dia {dayPlan.day}</h3>
                        {dayPlan.summary && <p className="text-sm italic text-gray-600 mb-2">{dayPlan.summary}</p>}
                        {dayPlan.estimatedTotalNutrients && (
                            <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded border">
                                Estimativa diária: {dayPlan.estimatedTotalNutrients.Energia?.toFixed(0)} Kcal,
                                P: {dayPlan.estimatedTotalNutrients.Proteína?.toFixed(1)}g,
                                C: {dayPlan.estimatedTotalNutrients.Carboidrato?.toFixed(1)}g,
                                L: {dayPlan.estimatedTotalNutrients.Lipídeos?.toFixed(1)}g
                            </div>
                        )}
                        <button onClick={() => setExpandedPlanDay(expandedPlanDay === dayPlan.day ? null : dayPlan.day)}
                            className="w-full text-left p-2 mb-2 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-700 font-medium flex justify-between items-center text-sm"
                            aria-expanded={expandedPlanDay === dayPlan.day}
                            aria-controls={`day-${dayPlan.day}-details`}
                        >
                            {expandedPlanDay === dayPlan.day ? 'Ocultar Detalhes do Dia' : 'Mostrar Detalhes do Dia'}
                            {expandedPlanDay === dayPlan.day ? <IconChevronUp /> : <IconChevronDown />}
                        </button>
                        {expandedPlanDay === dayPlan.day && (
                            <div id={`day-${dayPlan.day}-details`} className="space-y-4">
                                {dayPlan.meals.map((meal, mealIdx) => (
                                    <div key={mealIdx} className="p-3 border border-gray-200 rounded-md bg-gray-50">
                                        <h4 className="font-semibold text-gray-800">{meal.mealType as string}</h4>
                                        {meal.description && <p className="text-xs italic text-gray-600 mb-1">{meal.description}</p>}
                                        {meal.estimatedMealNutrients && (
                                             <p className="text-xs text-gray-500 mb-1">
                                                (Est: {meal.estimatedMealNutrients.Energia?.toFixed(0)} Kcal,
                                                P: {meal.estimatedMealNutrients.Proteína?.toFixed(1)}g,
                                                C: {meal.estimatedMealNutrients.Carboidrato?.toFixed(1)}g,
                                                L: {meal.estimatedMealNutrients.Lipídeos?.toFixed(1)}g)
                                            </p>
                                        )}
                                        <ul className="list-disc list-inside pl-3 text-sm text-gray-700 space-y-0.5">
                                            {meal.items.map((item, itemIdx) => (
                                                <li key={itemIdx}>{item.name}: {parseGeminiQuantity(item.quantity)} {normalizeUnit(item.unit)}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </section>
        )}
         {!isLoading && generationMode === 'dietPlan' && suggestedDietPlan.length === 0 && planTargetCalories > 0 && (
            <div className="text-center py-10 bg-white rounded-lg shadow" aria-live="polite">
                <IconCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Nenhuma sugestão de plano de dieta encontrada.</p>
                <p className="text-gray-500 mt-2">Tente ajustar os critérios ou preferências.</p>
            </div>
        )}
        </>
      )}
      <Modal isOpen={isSavePlanModalOpen} onClose={() => setIsSavePlanModalOpen(false)} title="Salvar Plano de Dieta Gerado">
        <div>
          <label htmlFor="planStartDate" className="block text-sm font-medium text-gray-700">Data de Início do Plano</label>
          <input 
            type="date" 
            id="planStartDate" 
            value={planStartDate} 
            onChange={(e) => setPlanStartDate(e.target.value)}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-1">O plano de {suggestedDietPlan.length} dia(s) será adicionado a partir desta data.</p>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsSavePlanModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveDietPlan} disabled={isLoading}>Salvar no Planejador</Button>
        </div>
      </Modal>
    </div>
  );
};

export default SmartRecipePage;