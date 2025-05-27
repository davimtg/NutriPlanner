
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { SavedDietPlan, NutrientInfo, DailyPlan, Meal } from '../types'; // Added Meal, DailyPlan
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconHistory, IconRestore, IconTrash, IconCalendar, IconFileText, IconDownload, IconSearch, IconChevronDown, IconChevronUp } from '../components/Icon'; // Added Chevron icons
import { useGlobalToast } from '../App';
import { DEFAULT_NUTRIENT_INFO } from '../constants'; // Added DEFAULT_NUTRIENT_INFO

const calculateAverageNutrients = (plan: SavedDietPlan): NutrientInfo => {
  if (!plan.dailyPlans || plan.dailyPlans.length === 0) {
    return { ...DEFAULT_NUTRIENT_INFO };
  }
  const sum: NutrientInfo = { ...DEFAULT_NUTRIENT_INFO };
  plan.dailyPlans.forEach(dp => {
    if (dp.totalNutrients) {
      (Object.keys(sum) as Array<keyof NutrientInfo>).forEach(key => {
        sum[key] += dp.totalNutrients![key] || 0;
      });
    }
  });
  const count = plan.dailyPlans.length;
  const avg: NutrientInfo = { ...DEFAULT_NUTRIENT_INFO };
  (Object.keys(sum) as Array<keyof NutrientInfo>).forEach(key => {
    avg[key] = sum[key] / count;
  });
  return avg;
};


const DietHistoryPage: React.FC = () => {
  const { savedDietPlans, restoreSavedDietPlan, deleteSavedDietPlan, exportDietToCsv } = useData();
  const { addToast } = useGlobalToast();
  const navigate = useNavigate();

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavedDietPlan | null>(null);
  const [tagFilter, setTagFilter] = useState('');
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);


  const openRestoreModal = (plan: SavedDietPlan) => {
    setSelectedPlan(plan);
    setIsRestoreModalOpen(true);
  };

  const openDeleteModal = (plan: SavedDietPlan) => {
    setSelectedPlan(plan);
    setIsDeleteModalOpen(true);
  };

  const handleRestore = () => {
    if (selectedPlan) {
      restoreSavedDietPlan(selectedPlan.id);
      setIsRestoreModalOpen(false);
      setSelectedPlan(null);
      addToast(`Plano "${selectedPlan.name}" restaurado com sucesso!`, "success");
      navigate(`/planner?date=${selectedPlan.startDate}`); 
    }
  };

  const handleDelete = () => {
    if (selectedPlan) {
      deleteSavedDietPlan(selectedPlan.id);
      addToast(`Plano "${selectedPlan.name}" excluído.`, "info");
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  };
  
  const handleExportPlanToCSV = (plan: SavedDietPlan) => {
    try {
      const csvString = exportDietToCsv(plan.startDate, plan.endDate);
      const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `nutriplanner_dieta_${plan.name.replace(/\s+/g, '_')}_${plan.startDate}_a_${plan.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      addToast(`Plano "${plan.name}" exportado para CSV.`, "success");
    } catch (e) {
      addToast(`Erro ao exportar plano: ${(e as Error).message}`, "error");
    }
  };
  
   const handleExportPlanToPDF = (plan: SavedDietPlan) => {
    addToast(`Para exportar "${plan.name}" para PDF, restaure o plano e use a função de impressão do navegador no Planejador.`, "info", 7000);
  };

  const filteredSavedDietPlans = useMemo(() => {
    if (!tagFilter.trim()) {
      return savedDietPlans;
    }
    const lowerCaseFilter = tagFilter.toLowerCase().trim();
    return savedDietPlans.filter(plan => 
      plan.tags && plan.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilter))
    );
  }, [savedDietPlans, tagFilter]);

  const togglePreview = (planId: string) => {
    setExpandedPreviewId(prevId => prevId === planId ? null : planId);
  };


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <IconHistory className="w-10 h-10 text-emerald-600" />
          <h1 className="text-4xl font-bold text-gray-800">Histórico de Dietas Salvas</h1>
        </div>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconSearch />
            </div>
            <input 
                type="text" 
                placeholder="Filtrar por tag..."
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
            />
        </div>
      </header>

      {filteredSavedDietPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">
            {savedDietPlans.length === 0 ? "Nenhum plano de dieta salvo ainda." : "Nenhum plano encontrado com esta tag."}
          </p>
          <p className="text-gray-500 mt-2">
            {savedDietPlans.length === 0 ? "Vá para Configurações do Plano para salvar seu plano atual." : "Tente um filtro diferente ou limpe o filtro."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSavedDietPlans.map(plan => {
            const averageNutrients = calculateAverageNutrients(plan);
            const isPreviewOpen = expandedPreviewId === plan.id;
            return (
            <div key={plan.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-emerald-700 mb-1 truncate" title={plan.name}>{plan.name}</h2>
                {plan.description && <p className="text-sm text-gray-600 mb-1 line-clamp-2">{plan.description}</p>}
                 {plan.tags && plan.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                        {plan.tags.map(tag => (
                            <span key={tag} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                    </div>
                )}
                {plan.userNotes && (
                    <details className="mb-2 text-sm">
                        <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Ver Notas</summary>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-gray-600 whitespace-pre-wrap text-xs">{plan.userNotes}</p>
                    </details>
                )}
                <p className="text-xs text-gray-500 mb-1">
                  Período: {new Date(plan.startDate + "T00:00:00").toLocaleDateString('pt-BR')} - {new Date(plan.endDate + "T00:00:00").toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500 mb-2">
                  Salvo em: {new Date(plan.savedAt).toLocaleString('pt-BR')}
                </p>
                
                {/* Quick Preview Section */}
                <div className="mt-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => togglePreview(plan.id)} 
                        className="w-full text-sm text-emerald-600 hover:bg-emerald-50"
                        rightIcon={isPreviewOpen ? <IconChevronUp /> : <IconChevronDown />}
                        aria-expanded={isPreviewOpen}
                        aria-controls={`preview-${plan.id}`}
                    >
                        Pré-visualizar Plano
                    </Button>
                    {isPreviewOpen && (
                        <div id={`preview-${plan.id}`} className="mt-2 p-3 bg-emerald-50 rounded-md border border-emerald-200 text-xs space-y-2">
                            <h4 className="font-semibold text-emerald-700">Nutrientes Médios Diários:</h4>
                            <ul className="list-disc list-inside ml-2 text-gray-700">
                                <li>Energia: {averageNutrients.Energia.toFixed(0)} Kcal</li>
                                <li>Proteína: {averageNutrients.Proteína.toFixed(1)} g</li>
                                <li>Carboidrato: {averageNutrients.Carboidrato.toFixed(1)} g</li>
                                <li>Lipídeos: {averageNutrients.Lipídeos.toFixed(1)} g</li>
                            </ul>
                            {plan.dailyPlans && plan.dailyPlans.length > 0 && (
                                <>
                                <h4 className="font-semibold text-emerald-700 pt-1">Início do Plano (Primeiros {Math.min(2, plan.dailyPlans.length)} dias):</h4>
                                {plan.dailyPlans.slice(0, 2).map(dp => (
                                    <div key={dp.date} className="text-gray-700">
                                        <p className="font-medium">{new Date(dp.date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}:</p>
                                        <ul className="list-disc list-inside ml-4">
                                            {dp.meals.filter(meal => meal.items.length > 0).map(meal => (
                                                <li key={meal.mealType} className="truncate" title={meal.items.map(it => it.customName || (it.type === 'ingredient' ? 'Ing.' : 'Rec.')).join(', ')}>
                                                    {meal.mealType}: {meal.items.length} item(s)
                                                </li>
                                            ))}
                                            {dp.meals.every(meal => meal.items.length === 0) && <li>Nenhuma refeição planejada.</li>}
                                        </ul>
                                    </div>
                                ))}
                                </>
                            )}
                        </div>
                    )}
                </div>

              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <Button onClick={() => openRestoreModal(plan)} variant="primary" className="w-full" leftIcon={<IconRestore />}>
                  Restaurar Plano
                </Button>
                <div className="flex gap-2">
                    <Button onClick={() => handleExportPlanToCSV(plan)} variant="ghost" className="flex-1" leftIcon={<IconDownload />}>
                        CSV
                    </Button>
                    <Button onClick={() => handleExportPlanToPDF(plan)} variant="ghost" className="flex-1" leftIcon={<IconFileText />}>
                        PDF
                    </Button>
                </div>
                <Button onClick={() => openDeleteModal(plan)} variant="danger" className="w-full" leftIcon={<IconTrash />}>
                  Excluir Plano
                </Button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Confirmar Restauração"
      >
        <p>Tem certeza que deseja restaurar o plano "{selectedPlan?.name}"? O seu plano de refeições atual será mesclado com os dados deste plano salvo (dias do plano salvo irão sobrescrever dias existentes no planejador se houver conflito de datas).</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsRestoreModalOpen(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleRestore}>Restaurar</Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <p>Tem certeza que deseja excluir o plano "{selectedPlan?.name}"? Esta ação não pode ser desfeita.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </div>
  );
};

export default DietHistoryPage;
