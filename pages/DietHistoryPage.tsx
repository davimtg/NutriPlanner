import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { SavedDietPlan } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconHistory, IconRestore, IconTrash, IconCalendar, IconFileText, IconDownload } from '../components/Icon';

const DietHistoryPage: React.FC = () => {
  const { savedDietPlans, restoreSavedDietPlan, deleteSavedDietPlan, exportDietToCsv } = useData();
  const navigate = useNavigate();

  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SavedDietPlan | null>(null);

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
      navigate(`/planner?date=${selectedPlan.startDate}`); // Navigate to planner with start date of restored plan
    }
  };

  const handleDelete = () => {
    if (selectedPlan) {
      deleteSavedDietPlan(selectedPlan.id);
      setIsDeleteModalOpen(false);
      setSelectedPlan(null);
    }
  };
  
  const handleExportPlanToCSV = (plan: SavedDietPlan) => {
    const csvString = exportDietToCsv(plan.startDate, plan.endDate);
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nutriplanner_dieta_${plan.name.replace(/\s+/g, '_')}_${plan.startDate}_a_${plan.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };
  
   const handleExportPlanToPDF = (plan: SavedDietPlan) => {
    // For PDF, we'd ideally show only this plan's details in a printable format.
    // A simple way is to navigate to the planner with this plan loaded temporarily
    // and then trigger print. Or, generate a specific printable HTML view for the plan.
    // For now, this is a placeholder for a more complex PDF generation.
    alert(`Funcionalidade de exportar PDF para "${plan.name}" ainda não implementada. Você pode restaurar o plano e exportá-lo do Planejador.`);
    // A more advanced approach would involve:
    // 1. Storing the plan to be printed in a temporary state or context.
    // 2. Navigating to a print-preview page that renders only that plan.
    // 3. Calling window.print() on that page.
  };


  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <IconHistory className="w-10 h-10 text-emerald-600" />
        <h1 className="text-4xl font-bold text-gray-800">Histórico de Dietas Salvas</h1>
      </header>

      {savedDietPlans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Nenhum plano de dieta salvo ainda.</p>
          <p className="text-gray-500 mt-2">Vá para o Planejador para salvar seu plano atual.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedDietPlans.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-emerald-700 mb-2 truncate" title={plan.name}>{plan.name}</h2>
                {plan.description && <p className="text-sm text-gray-600 mb-1 line-clamp-2">{plan.description}</p>}
                <p className="text-xs text-gray-500 mb-1">
                  Período: {new Date(plan.startDate + "T00:00:00").toLocaleDateString('pt-BR')} - {new Date(plan.endDate + "T00:00:00").toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Salvo em: {new Date(plan.savedAt).toLocaleString('pt-BR')}
                </p>
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
          ))}
        </div>
      )}

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        title="Confirmar Restauração"
      >
        <p>Tem certeza que deseja restaurar o plano "{selectedPlan?.name}"? O seu plano de refeições atual será substituído pelos dados deste plano salvo.</p>
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