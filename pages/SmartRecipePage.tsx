
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { useData } from '../hooks/useData';
import { Ingredient, RecipeIngredient as AppRecipeIngredient, MealType, RecipeDifficulty, NutrientInfo } from '../types';
import Button from '../components/Button';
import { IconSparkles, IconBook, IconSave } from '../components/Icon';
import { MEAL_TYPES_ORDERED, DEFAULT_NUTRIENT_INFO, PLACEHOLDER_IMAGE_URL, RECIPE_DIFFICULTY_LEVELS, UNITS_OF_MEASUREMENT } from '../constants';
import { useGlobalToast } from '../App';
import { generateId } from '../utils/idGenerator';

// Gemini specific types
interface GeminiRecipeIngredient {
  name: string;
  quantity: number | string; // Gemini might return string, be flexible
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

const SmartRecipePage: React.FC = () => {
  const { ingredients: userIngredients, addIngredient, getIngredientById, addRecipe } = useData();
  const { addToast } = useGlobalToast();

  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [mealType, setMealType] = useState<MealType | ''>('');
  const [preferences, setPreferences] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRecipes, setSuggestedRecipes] = useState<GeminiSuggestedRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipeNames, setSavedRecipeNames] = useState<string[]>([]); // Store names of saved recipes

  const [ai, setAi] = useState<GoogleGenAI | null>(null);

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


  const handleIngredientToggle = (ingredientId: string) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      }
      if (prev.length < 3) {
        return [...prev, ingredientId];
      }
      addToast("Você pode selecionar no máximo 3 ingredientes.", "warning");
      return prev;
    });
  };

  const parseGeminiQuantity = (quantityStr: number | string): number => {
    if (typeof quantityStr === 'number') return quantityStr > 0 ? quantityStr : 1;
    if (typeof quantityStr === 'string') {
      const cleanedStr = quantityStr.toLowerCase();
      if (cleanedStr.includes('a gosto') || cleanedStr.includes('to taste') || cleanedStr.includes('pitada') || cleanedStr.includes('as needed')) {
        return 1; 
      }
      const match = cleanedStr.match(/(\d+(\.\d+)?)/);
      if (match && match[1]) {
        const parsed = parseFloat(match[1]);
        return parsed > 0 ? parsed : 1;
      }
    }
    return 1; 
  };
  
  const normalizeUnit = (unitStr: string): string => {
    const lowerUnit = unitStr.toLowerCase().trim();
    const foundUnit = UNITS_OF_MEASUREMENT.find(uom => 
        uom.value.toLowerCase() === lowerUnit || 
        uom.label.toLowerCase().includes(lowerUnit) ||
        (uom.value + 's').toLowerCase() === lowerUnit // e.g. xícara vs xícaras
    );
    if (foundUnit) return foundUnit.value;

    // Common AI variations
    if (lowerUnit.includes('gram') || lowerUnit === 'g') return 'g';
    if (lowerUnit.includes('milliliter') || lowerUnit === 'ml') return 'ml';
    if (lowerUnit.includes('tablespoon') || lowerUnit.includes('colher de sopa')) return 'colher de sopa';
    if (lowerUnit.includes('teaspoon') || lowerUnit.includes('colher de chá')) return 'colher de chá';
    if (lowerUnit.includes('cup') || lowerUnit.includes('xícara')) return 'xícara';
    if (lowerUnit.includes('unit') || lowerUnit.includes('unidade')) return 'unidade';
    if (lowerUnit.includes('slice') || lowerUnit.includes('fatia')) return 'fatia';
    if (lowerUnit.includes('piece') || lowerUnit.includes('pedaço')) return 'pedaço';
    if (lowerUnit.includes('to taste') || lowerUnit.includes('a gosto') || lowerUnit.includes('q.b.')) return 'a gosto';
    
    return 'unidade'; // Fallback
  };


  const getSuggestions = async () => {
    if (!ai) {
      setError("Serviço de IA não inicializado. Verifique a API KEY.");
      addToast("Serviço de IA não está pronto. Verifique a API KEY.", "error");
      return;
    }
    if (selectedIngredients.length === 0) {
      addToast("Por favor, selecione pelo menos um ingrediente.", "warning");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedRecipes([]);

    const ingredientNames = selectedIngredients.map(id => getIngredientById(id)?.name).filter(Boolean).join(', ');

    const prompt = `
      Você é um assistente de culinária especialista em criar receitas deliciosas e práticas.
      Sugira 1 a 3 receitas com base nos seguintes critérios.

      Ingredientes disponíveis que DEVEM ser usados (pelo menos um deles): ${ingredientNames}.
      ${mealType ? `Tipo de refeição desejado: ${mealType}.` : ''}
      ${preferences ? `Preferências adicionais (como tipo de cozinha, restrições alimentares, etc.): ${preferences}.` : ''}

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

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-04-17",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      let jsonStr = response.text.trim();
      // Updated fence removal logic based on @google/genai guidelines
      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[2]) {
        jsonStr = match[2].trim();
      }
      
      const parsedRecipes: GeminiSuggestedRecipe[] = JSON.parse(jsonStr);
      
      if (!Array.isArray(parsedRecipes)) {
        throw new Error("A resposta da IA não é um array de receitas válido.");
      }
      
      parsedRecipes.forEach(recipe => { // Basic validation
        if (!recipe.name || !Array.isArray(recipe.ingredients) || !recipe.instructions || !recipe.description) {
            console.warn("Receita da IA com estrutura incompleta:", recipe);
            throw new Error(`Estrutura da receita "${recipe.name || 'Desconhecida'}" inválida recebida da IA.`);
        }
        recipe.ingredients.forEach(ing => {
            if(typeof ing.name !== 'string' || typeof ing.unit !== 'string' || (typeof ing.quantity !== 'number' && typeof ing.quantity !== 'string')){
                 console.warn("Ingrediente da IA com estrutura incompleta:", ing, "na receita", recipe.name);
                 throw new Error(`Estrutura do ingrediente "${ing.name || 'Desconhecido'}" inválida na receita "${recipe.name}".`);
            }
        });
      });

      setSuggestedRecipes(parsedRecipes);
      if (parsedRecipes.length === 0) {
        addToast("Nenhuma sugestão encontrada para esses critérios.", "info");
      }
    } catch (e) {
      console.error("Error fetching or parsing suggestions:", e);
      setError(`Erro ao buscar sugestões: ${(e as Error).message}. Verifique o console para mais detalhes. Tente novamente.`);
      addToast(`Erro ao buscar sugestões: ${(e as Error).message}`, "error", 10000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRecipe = async (geminiRecipe: GeminiSuggestedRecipe) => {
    const recipeAppIngredients: AppRecipeIngredient[] = [];
    let errorDuringSave = false;

    for (const geminiIng of geminiRecipe.ingredients) {
      let appIngredient = userIngredients.find(
        (ing) => ing.name.toLowerCase() === geminiIng.name.toLowerCase()
      );

      if (!appIngredient) {
        const unitToSave = normalizeUnit(geminiIng.unit);
        try {
          appIngredient = addIngredient({
            name: geminiIng.name,
            unit: unitToSave,
            setor: 'Importado IA', // Default setor
            ...DEFAULT_NUTRIENT_INFO, // Default nutrients
          });
          addToast(`Novo ingrediente "${geminiIng.name}" (${unitToSave}) adicionado à sua biblioteca. Revise os dados nutricionais.`, "info", 7000);
        } catch (e) {
          addToast(`Erro ao adicionar novo ingrediente "${geminiIng.name}": ${(e as Error).message}`, "error");
          errorDuringSave = true;
          break; 
        }
      }
      
      const quantity = parseGeminiQuantity(geminiIng.quantity);
      recipeAppIngredients.push({ ingredientId: appIngredient.id, quantity });
    }

    if (errorDuringSave) {
        addToast("Não foi possível salvar a receita devido a um erro com os ingredientes.", "error");
        return;
    }

    const newRecipeData = {
      name: geminiRecipe.name,
      instructions: geminiRecipe.instructions,
      servings: 2, // Default servings
      ingredients: recipeAppIngredients,
      imageUrl: `${PLACEHOLDER_IMAGE_URL}?text=${encodeURIComponent(geminiRecipe.name)}&id=${generateId()}`,
      prepTime: geminiRecipe.prepTime,
      difficulty: RECIPE_DIFFICULTY_LEVELS.includes(geminiRecipe.difficulty) ? geminiRecipe.difficulty : 'Médio',
    };

    try {
      const savedRecipe = addRecipe(newRecipeData);
      addToast(`Receita "${savedRecipe.name}" salva na sua biblioteca!`, "success");
      setSavedRecipeNames(prev => [...prev, geminiRecipe.name]); // Track by name
    } catch (e) {
       addToast(`Erro ao salvar receita: ${(e as Error).message}`, "error");
    }
  };

  const sortedUserIngredients = useMemo(() => {
    return [...userIngredients].sort((a, b) => a.name.localeCompare(b.name));
  }, [userIngredients]);


  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <IconSparkles className="w-10 h-10 text-emerald-600" />
        <h1 className="text-4xl font-bold text-gray-800">Sugestões Inteligentes de Receitas</h1>
      </header>

      {!ai && error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
            <p className="font-semibold">Erro de Configuração</p>
            <p>{error}</p>
        </div>
      )}

      {ai && (
        <>
        <section className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Seus Critérios</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="ingredient-select" className="block text-sm font-medium text-gray-700 mb-1">Selecione 1 a 3 ingredientes que você possui:</label>
              <div id="ingredient-select" className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2 space-y-1 bg-gray-50">
                {sortedUserIngredients.map(ing => (
                  <label key={ing.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      id={`ing-${ing.id}`}
                      name="selectedIngredients"
                      value={ing.id}
                      checked={selectedIngredients.includes(ing.id)}
                      onChange={() => handleIngredientToggle(ing.id)}
                      disabled={selectedIngredients.length >= 3 && !selectedIngredients.includes(ing.id)}
                      className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-2"
                      aria-labelledby={`ing-label-${ing.id}`}
                    />
                    <span id={`ing-label-${ing.id}`} className="text-sm text-gray-800">{ing.name}</span>
                  </label>
                ))}
                 {sortedUserIngredients.length === 0 && <p className="text-sm text-gray-500 p-2">Nenhum ingrediente cadastrado. Adicione ingredientes em "Gerenciar Dados".</p>}
              </div>
              <p className="text-xs text-gray-500 mt-1">{selectedIngredients.length}/3 ingredientes selecionados.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="mealType" className="block text-sm font-medium text-gray-700">Tipo de Refeição (Opcional)</label>
                <select
                  id="mealType"
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value as MealType | '')}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Qualquer</option>
                  {MEAL_TYPES_ORDERED.map(mt => <option key={mt} value={mt}>{mt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="preferences" className="block text-sm font-medium text-gray-700">Preferências Adicionais (Opcional)</label>
                <input
                  type="text"
                  id="preferences"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="Ex: Italiana, vegetariana, rápida, sem glúten"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <Button onClick={getSuggestions} disabled={isLoading || selectedIngredients.length === 0 || !ai} leftIcon={<IconSparkles />}>
              {isLoading ? 'Buscando sugestões...' : 'Obter Sugestões de Receitas'}
            </Button>
            {!ai && <p className="text-xs text-red-500 mt-1">Serviço de IA indisponível. Verifique a API KEY.</p>}
          </div>
        </section>

        {isLoading && (
          <div className="text-center py-10" aria-live="polite" aria-busy="true">
            <div role="status" className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-emerald-600 motion-reduce:animate-[spin_1.5s_linear_infinite]" aria-label="Loading...">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Carregando...
              </span>
            </div>
            <p className="mt-2 text-gray-600">Aguarde, estamos preparando suas receitas...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md" role="alert">
            <p className="font-semibold">Ocorreu um erro:</p>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && suggestedRecipes.length > 0 && (
          <section className="space-y-6" aria-live="polite">
            <h2 className="text-2xl font-semibold text-gray-700">Receitas Sugeridas ({suggestedRecipes.length})</h2>
            {suggestedRecipes.map((recipe, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
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
                    {recipe.instructions.split('\\n').map((step, stepIdx) => <p key={stepIdx}>{step.replace(/^\d+\.\s*/, '')}</p>)}
                  </div>
                </div>
                
                <Button 
                    onClick={() => handleSaveRecipe(recipe)} 
                    disabled={savedRecipeNames.includes(recipe.name)}
                    leftIcon={<IconSave />}
                    aria-label={savedRecipeNames.includes(recipe.name) ? `Receita ${recipe.name} já salva` : `Salvar receita ${recipe.name} na biblioteca`}
                >
                  {savedRecipeNames.includes(recipe.name) ? 'Já Salva!' : 'Salvar na Biblioteca'}
                </Button>
              </div>
            ))}
          </section>
        )}
         {!isLoading && !error && suggestedRecipes.length === 0 && selectedIngredients.length > 0 && !isLoading && ( // Condition to show "no suggestions" only after a search
            <div className="text-center py-10 bg-white rounded-lg shadow" aria-live="polite">
                <IconBook className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">Nenhuma sugestão encontrada para os critérios atuais.</p>
                <p className="text-gray-500 mt-2">Tente alterar os ingredientes ou as preferências.</p>
            </div>
        )}
        </>
      )}
    </div>
  );
};

export default SmartRecipePage;
