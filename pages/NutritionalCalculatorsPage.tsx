
import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { NutrientInfo } from '../types';
import Button from '../components/Button';
import { IconCalculator, IconTarget, IconSave, IconBody } from '../components/Icon';
import { useGlobalToast } from '../App';
import { ACTIVITY_LEVEL_OPTIONS, GOAL_OPTIONS, DEFAULT_MACRO_PERCENTAGES } from '../constants';

type Gender = 'male' | 'female';
type Formula = 'mifflin' | 'katch';

const NutritionalCalculatorsPage: React.FC = () => {
  const { globalTargetNutrients, updateGlobalTargetNutrients } = useData();
  const { addToast } = useGlobalToast();

  // Personal Data State
  const [age, setAge] = useState<number | ''>(30);
  const [gender, setGender] = useState<Gender>('male');
  const [height, setHeight] = useState<number | ''>(170); // cm
  const [weight, setWeight] = useState<number | ''>(70); // kg
  
  // Bioimpedance State
  const [bodyFat, setBodyFat] = useState<number | ''>(''); // %
  const [visceralFat, setVisceralFat] = useState<number | ''>(''); // level
  const [bodyAge, setBodyAge] = useState<number | ''>(''); // years
  const [skeletalMuscleMass, setSkeletalMuscleMass] = useState<number | ''>(''); // kg
  const [basalMetabolismKcal, setBasalMetabolismKcal] = useState<number | ''>(''); // kcal from scale
  
  // Calculated Bioimpedance Metrics
  const [bmi, setBmi] = useState<number | null>(null);
  const [leanBodyMass, setLeanBodyMass] = useState<number | null>(null);

  // Calculator Settings State
  const [formula, setFormula] = useState<Formula>('mifflin');
  const [activityLevel, setActivityLevel] = useState<string>('moderate');
  const [goal, setGoal] = useState<string>('maintain');

  // Results State
  const [bmr, setBmr] = useState<number | null>(null);
  const [tdee, setTdee] = useState<number | null>(null);
  const [manualTdee, setManualTdee] = useState<number | ''>(tdee || globalTargetNutrients.Energia || 2000);
  const [calculatedMacros, setCalculatedMacros] = useState<NutrientInfo | null>(null);

  // Effect to calculate BMI and LBM on data change
  useEffect(() => {
    if (weight && height) {
      const heightInMeters = Number(height) / 100;
      setBmi(Number(weight) / (heightInMeters * heightInMeters));
    } else {
      setBmi(null);
    }

    if (weight && bodyFat) {
      setLeanBodyMass(Number(weight) * (1 - (Number(bodyFat) / 100)));
    } else {
      setLeanBodyMass(null);
    }
  }, [weight, height, bodyFat]);

  // Effect to update manual TDEE input
  useEffect(() => {
    if (tdee) {
      setManualTdee(parseFloat(tdee.toFixed(0)));
    } else if (globalTargetNutrients.Energia > 0) {
      setManualTdee(globalTargetNutrients.Energia)
    }
  }, [tdee, globalTargetNutrients.Energia]);

  const calculateBmrTdee = () => {
    let calculatedBmr;
    if (formula === 'katch') {
      if (!leanBodyMass) {
        addToast("Para usar a fórmula Katch-McArdle, preencha o Peso e o Percentual de Gordura.", "error");
        return;
      }
      // Katch-McArdle Formula
      calculatedBmr = 370 + (21.6 * leanBodyMass);
    } else { // Mifflin-St Jeor
      if (!age || !height || !weight) {
        addToast("Para usar a fórmula Mifflin-St Jeor, preencha Idade, Altura e Peso.", "error");
        return;
      }
      if (gender === 'male') {
        calculatedBmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age)) + 5;
      } else {
        calculatedBmr = (10 * Number(weight)) + (6.25 * Number(height)) - (5 * Number(age)) - 161;
      }
    }
    
    setBmr(calculatedBmr);
    const activityMultiplier = ACTIVITY_LEVEL_OPTIONS.find(opt => opt.value === activityLevel)?.multiplier || 1.55;
    const calculatedTdee = calculatedBmr * activityMultiplier;
    setTdee(calculatedTdee);
    addToast("BMR e TDEE calculados!", "success");
  };

  const calculateMacros = () => {
    if (!manualTdee || manualTdee <= 0) {
        addToast("Por favor, insira um valor válido para Gasto Energético Diário Total (TDEE).", "error");
        setCalculatedMacros(null);
        return;
    }
    const goalAdjustment = GOAL_OPTIONS.find(opt => opt.value === goal)?.adjustment || 0;
    const targetCalories = Number(manualTdee) + goalAdjustment;
    
    const proteinGrams = (targetCalories * DEFAULT_MACRO_PERCENTAGES.protein) / 4;
    const carbsGrams = (targetCalories * DEFAULT_MACRO_PERCENTAGES.carbs) / 4;
    const fatGrams = (targetCalories * DEFAULT_MACRO_PERCENTAGES.fat) / 9;

    setCalculatedMacros({
      Energia: targetCalories,
      Proteína: proteinGrams,
      Carboidrato: carbsGrams,
      Lipídeos: fatGrams,
      Colesterol: globalTargetNutrients.Colesterol, // Keep existing or default
      FibraAlimentar: globalTargetNutrients.FibraAlimentar, // Keep existing or default
    });
    addToast("Macronutrientes calculados!", "success");
  };

  const handleUseAsGlobalTargets = () => {
    let targetsToUpdate: Partial<NutrientInfo> = {};
    if (calculatedMacros) {
      targetsToUpdate = {
        Energia: calculatedMacros.Energia,
        Proteína: calculatedMacros.Proteína,
        Carboidrato: calculatedMacros.Carboidrato,
        Lipídeos: calculatedMacros.Lipídeos,
      };
      updateGlobalTargetNutrients({ ...globalTargetNutrients, ...targetsToUpdate });
      addToast("Metas globais atualizadas com os resultados da calculadora!", "success");
    } else if (tdee) {
      targetsToUpdate = { Energia: tdee };
      updateGlobalTargetNutrients({ ...globalTargetNutrients, ...targetsToUpdate });
      addToast(`Meta global de energia atualizada para ${tdee.toFixed(0)} Kcal. Calcule os macros para metas completas.`, "info", 6000);
    } else {
      addToast("Nenhum cálculo para aplicar. Por favor, calcule BMR/TDEE ou Macros primeiro.", "warning");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <IconCalculator className="w-10 h-10 text-emerald-600" />
        <h1 className="text-4xl font-bold text-gray-800">Calculadoras Nutricionais</h1>
      </header>
      <p className="text-lg text-gray-600">
        Utilize estas ferramentas para estimar suas necessidades energéticas e de macronutrientes.
        Os resultados podem ser usados para definir suas metas globais no aplicativo.
      </p>

      {/* Personal Data */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center"><IconBody className="mr-2"/>Dados Pessoais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Idade (anos)</label>
            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Sexo Biológico</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700">Altura (cm)</label>
            <input type="number" id="height" value={height} onChange={(e) => setHeight(e.target.value === '' ? '' : parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700">Peso (kg)</label>
            <input type="number" id="weight" value={weight} onChange={(e) => setWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
        </div>
      </section>

      {/* Bioimpedance Section */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Dados de Bioimpedância (Opcional)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <div>
            <label htmlFor="bodyFat" className="block text-sm font-medium text-gray-700">Gordura Corporal (%)</label>
            <input type="number" id="bodyFat" value={bodyFat} onChange={(e) => setBodyFat(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="visceralFat" className="block text-sm font-medium text-gray-700">Gordura Visceral (nível)</label>
            <input type="number" id="visceralFat" value={visceralFat} onChange={(e) => setVisceralFat(e.target.value === '' ? '' : parseInt(e.target.value))} step="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="bodyAge" className="block text-sm font-medium text-gray-700">Idade Corporal</label>
            <input type="number" id="bodyAge" value={bodyAge} onChange={(e) => setBodyAge(e.target.value === '' ? '' : parseInt(e.target.value))} step="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
           <div>
            <label htmlFor="skeletalMuscleMass" className="block text-sm font-medium text-gray-700">Massa Muscular (kg)</label>
            <input type="number" id="skeletalMuscleMass" value={skeletalMuscleMass} onChange={(e) => setSkeletalMuscleMass(e.target.value === '' ? '' : parseFloat(e.target.value))} step="0.1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
          </div>
          <div>
            <label htmlFor="basalMetabolismKcal" className="block text-sm font-medium text-gray-700">Metabolismo Basal (Kcal)</label>
            <input type="number" id="basalMetabolismKcal" value={basalMetabolismKcal} onChange={(e) => setBasalMetabolismKcal(e.target.value === '' ? '' : parseInt(e.target.value))} step="1" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" placeholder="Informado pelo aparelho"/>
          </div>
        </div>
        {(bmi || leanBodyMass || skeletalMuscleMass || basalMetabolismKcal) && (
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bmi && <div><p className="text-sm font-medium text-gray-700">IMC (Índice de Massa Corporal)</p><p className="text-lg font-semibold text-emerald-700">{bmi.toFixed(2)} kg/m²</p></div>}
                {leanBodyMass && <div><p className="text-sm font-medium text-gray-700">Massa Magra (LBM)</p><p className="text-lg font-semibold text-emerald-700">{leanBodyMass.toFixed(2)} kg</p></div>}
                {skeletalMuscleMass && <div><p className="text-sm font-medium text-gray-700">Massa Muscular</p><p className="text-lg font-semibold text-emerald-700">{Number(skeletalMuscleMass).toFixed(2)} kg</p></div>}
                {basalMetabolismKcal && <div><p className="text-sm font-medium text-gray-700">Metabolismo Basal (informado)</p><p className="text-lg font-semibold text-emerald-700">{Number(basalMetabolismKcal).toFixed(0)} Kcal</p></div>}
            </div>
        )}
      </section>

      {/* BMR and TDEE Calculator */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-1">Calculadora de Gasto Energético (BMR & TDEE)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="formula" className="block text-sm font-medium text-gray-700">Fórmula de Cálculo</label>
            <select id="formula" value={formula} onChange={(e) => setFormula(e.target.value as Formula)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
              <option value="mifflin">Mifflin-St Jeor (Padrão)</option>
              <option value="katch">Katch-McArdle (Requer % Gordura)</option>
            </select>
          </div>
          <div>
            <label htmlFor="activityLevel" className="block text-sm font-medium text-gray-700">Nível de Atividade Física</label>
            <select id="activityLevel" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
              {ACTIVITY_LEVEL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        <Button onClick={calculateBmrTdee} leftIcon={<IconCalculator />}>Calcular BMR e TDEE</Button>
        
        {bmr !== null && tdee !== null && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-2">
            <h3 className="text-lg font-semibold text-emerald-700">Resultados Estimados ({formula === 'katch' ? 'Katch-McArdle' : 'Mifflin-St Jeor'}):</h3>
            <p><strong>Taxa Metabólica Basal (BMR):</strong> {bmr.toFixed(0)} Kcal/dia</p>
            <p><strong>Gasto Energético Diário Total (TDEE):</strong> {tdee.toFixed(0)} Kcal/dia</p>
          </div>
        )}
      </section>

      {/* Macronutrient Calculator */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-1">Calculadora de Macronutrientes</h2>
        <p className="text-sm text-gray-500 mb-4">Defina suas metas de macronutrientes com base no seu TDEE e objetivo.</p>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
                <label htmlFor="manualTdee" className="block text-sm font-medium text-gray-700">Gasto Energético Diário Total (TDEE)</label>
                <input type="number" id="manualTdee" value={manualTdee} onChange={(e) => setManualTdee(e.target.value === '' ? '' : parseFloat(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
                <p className="text-xs text-gray-500 mt-1">Use o resultado do cálculo acima ou sua meta de calorias.</p>
            </div>
            <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700">Objetivo</label>
                <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                  {GOAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
        </div>
        <Button onClick={calculateMacros} leftIcon={<IconCalculator />}>Calcular Macronutrientes</Button>
        <p className="text-xs text-gray-500 mt-1">Utiliza uma divisão padrão de {DEFAULT_MACRO_PERCENTAGES.carbs * 100}% Carboidratos, {DEFAULT_MACRO_PERCENTAGES.protein * 100}% Proteínas, {DEFAULT_MACRO_PERCENTAGES.fat * 100}% Gorduras.</p>


        {calculatedMacros && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-2">
            <h3 className="text-lg font-semibold text-emerald-700">Metas de Macronutrientes Calculadas:</h3>
            <p><strong>Calorias Totais:</strong> {calculatedMacros.Energia.toFixed(0)} Kcal/dia</p>
            <p><strong>Proteínas:</strong> {calculatedMacros.Proteína.toFixed(1)} g/dia</p>
            <p><strong>Carboidratos:</strong> {calculatedMacros.Carboidrato.toFixed(1)} g/dia</p>
            <p><strong>Gorduras:</strong> {calculatedMacros.Lipídeos.toFixed(1)} g/dia</p>
          </div>
        )}
      </section>
      
       {(tdee || calculatedMacros) && (
        <section className="mt-8 text-center">
            <Button 
                onClick={handleUseAsGlobalTargets} 
                variant="primary" 
                size="lg"
                leftIcon={<IconTarget />}
            >
                Usar {calculatedMacros ? "Macros Calculados" : "TDEE"} como Meta Global
            </Button>
        </section>
      )}

    </div>
  );
};

export default NutritionalCalculatorsPage;
