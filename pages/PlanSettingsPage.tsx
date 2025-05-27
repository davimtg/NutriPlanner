import React, { useState, useEffect, useCallback } from 'react';
import { useData } from '../hooks/useData';
import { NutrientInfo, CsvDietPlanItem, ImportBatch } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconSave, IconFileText, IconUpload, IconTarget, IconDownload, IconSettings } from '../components/Icon';
import Papa from 'papaparse';
import { CSV_DIET_PLAN_HEADERS } from '../constants'; 
import { useGlobalToast } from '../App'; // For toast notifications
import { generateId } from '../utils/idGenerator'; // Added import

const nutrientFormFields: { key: keyof NutrientInfo; label: string; unit: string, step?: string }[] = [
    { key: 'Energia', label: 'Energia', unit: 'Kcal', step: "1" },
    { key: 'Proteína', label: 'Proteína', unit: 'g', step: "0.1" },
    { key: 'Carboidrato', label: 'Carboidrato', unit: 'g', step: "0.1" },
    { key: 'Lipídeos', label: 'Lipídeos', unit: 'g', step: "0.1" },
    { key: 'Colesterol', label: 'Colesterol', unit: 'mg', step: "1" },
    { key: 'FibraAlimentar', label: 'Fibra Alimentar', unit: 'g', step: "0.1" },
];

const PlanSettingsPage: React.FC = () => {
  const {
    globalTargetNutrients, updateGlobalTargetNutrients,
    exportDietToCsv, importDietFromCsv, saveCurrentDietPlan,
  } = useData();
  const { addToast } = useGlobalToast();

  const [currentTargetNutrients, setCurrentTargetNutrients] = useState<NutrientInfo>(globalTargetNutrients);
  
  const [isSaveDietModalOpen, setIsSaveDietModalOpen] = useState(false);
  const [saveDietName, setSaveDietName] = useState('');
  const [saveDietDescription, setSaveDietDescription] = useState('');
  const [saveDietTags, setSaveDietTags] = useState('');
  const [saveDietUserNotes, setSaveDietUserNotes] = useState('');
  
  const today = new Date().toISOString().split('T')[0];
  const oneWeekFromToday = new Date();
  oneWeekFromToday.setDate(oneWeekFromToday.getDate() + 6);
  const defaultEndDate = oneWeekFromToday.toISOString().split('T')[0];

  const [saveDietStartDate, setSaveDietStartDate] = useState(today);
  const [saveDietEndDate, setSaveDietEndDate] = useState(defaultEndDate);
  
  const [exportStartDate, setExportStartDate] = useState(today);
  const [exportEndDate, setExportEndDate] = useState(defaultEndDate);
  
  const [importCsvFile, setImportCsvFile] = useState<File | null>(null);
  const [importStrategy, setImportStrategy] = useState<'replace' | 'merge'>('merge');
  const [isImporting, setIsImporting] = useState(false);


  useEffect(() => {
    setCurrentTargetNutrients(globalTargetNutrients);
  }, [globalTargetNutrients]);

  const handleTargetNutrientChange = (key: keyof NutrientInfo, value: string) => {
    setCurrentTargetNutrients(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSaveTargetNutrients = () => {
    updateGlobalTargetNutrients(currentTargetNutrients);
    addToast("Metas nutricionais globais salvas com sucesso!", "success");
  };
  
  const handleOpenSaveModal = () => {
    setSaveDietStartDate(today);
    setSaveDietEndDate(defaultEndDate);
    setSaveDietName(`Plano Salvo - ${new Date().toLocaleDateString('pt-BR')}`);
    setSaveDietDescription('');
    setSaveDietTags('');
    setSaveDietUserNotes('');
    setIsSaveDietModalOpen(true);
  }

  const handleSaveDiet = () => {
    if (!saveDietName.trim()) { addToast("Por favor, dê um nome ao plano de dieta.", "error"); return; }
    if (!saveDietStartDate || !saveDietEndDate) { addToast("Por favor, selecione um intervalo de datas para salvar.", "error"); return; }
    if (new Date(saveDietStartDate) > new Date(saveDietEndDate)) { addToast("A data inicial não pode ser posterior à data final.", "error"); return; }
    
    const tagsArray = saveDietTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const savedPlan = saveCurrentDietPlan(saveDietName, saveDietDescription, saveDietStartDate, saveDietEndDate, tagsArray, saveDietUserNotes);
    
    if (savedPlan) {
        setIsSaveDietModalOpen(false);
        addToast(`Plano "${saveDietName}" salvo com sucesso!`, "success");
    } else {
        addToast(`Nenhum dado no plano de refeições para o intervalo selecionado. Plano não salvo.`, "warning");
    }
  };

  const handleExportCSV = () => {
    if (!exportStartDate || !exportEndDate) { addToast("Por favor, selecione um intervalo de datas para exportar.", "error"); return; }
     if (new Date(exportStartDate) > new Date(exportEndDate)) { addToast("A data inicial não pode ser posterior à data final para exportação.", "error"); return; }

    try {
        const csvString = exportDietToCsv(exportStartDate, exportEndDate);
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `nutriplanner_dieta_${exportStartDate}_a_${exportEndDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        addToast("Plano de dieta exportado para CSV com sucesso!", "success");
    } catch (error) {
        addToast("Erro ao exportar CSV: " + (error as Error).message, "error");
    }
  };
  
  const handleExportPDF = () => {
    addToast("A funcionalidade de exportar para PDF (via impressão) é melhor utilizada diretamente na tela do Planejador.", "info", 7000);
    window.print(); 
  };

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
       if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        addToast("Por favor, selecione um arquivo CSV.", "error");
        event.target.value = ""; // Reset file input
        setImportCsvFile(null);
        return;
      }
      setImportCsvFile(file);
    }
  };

  const handleImportDiet = () => {
    if (!importCsvFile) { addToast("Por favor, selecione um arquivo CSV para importar.", "warning"); return; }
    setIsImporting(true);
    const currentFilename = importCsvFile.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        Papa.parse<CsvDietPlanItem>(text, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: (field: string | number) => {
                // Enable dynamic typing for quantity and nutrient fields
                if (typeof field === 'string' && (field === 'quantity' || field.endsWith('_kcal') || field.endsWith('_g') || field.endsWith('_mg'))) {
                    return true; 
                }
                return false;
            },
            complete: (results) => {
                setIsImporting(false);
                let batchResult: ImportBatch | null = null;

                if (results.errors.length > 0) {
                     batchResult = {id: generateId(), filename:currentFilename, date: new Date().toISOString(), type: 'dietPlan', successCount:0, errorCount: results.errors.length, errors: results.errors.map(err => `Linha ${err.row}: ${err.message}`), message: "Erro ao processar linhas do CSV." };
                } else {
                    const validItems = results.data.filter(item => 
                        item.date && item.mealType && item.itemType && item.itemId && item.itemName && typeof item.quantity === 'number'
                    );
                    if (validItems.length === 0) {
                         batchResult = {id: generateId(), filename:currentFilename, date: new Date().toISOString(), type: 'dietPlan', successCount:0, errorCount: 1, message: "Nenhum item válido encontrado no CSV após filtragem inicial." };
                    } else {
                        batchResult = importDietFromCsv(validItems, importStrategy, currentFilename);
                    }
                }
                
                if (batchResult) {
                    if (batchResult.errorCount > 0) {
                        addToast(`Importação do plano concluída com ${batchResult.errorCount} erros. ${batchResult.message || ''}`, "warning", 10000);
                    } else {
                        addToast(`Plano de dieta importado com sucesso! ${batchResult.message || ''}`, "success");
                    }
                     setImportCsvFile(null); 
                     const fileInput = document.getElementById('importDietCsvFile') as HTMLInputElement | null;
                    if (fileInput) fileInput.value = '';
                }
            },
            error: (error: any) => {
                setIsImporting(false);
                addToast(`Erro ao ler arquivo CSV: ${error.message}`, "error");
            }
        });
    };
    reader.readAsText(importCsvFile, 'UTF-8');
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3 mb-6">
        <IconSettings className="w-10 h-10 text-emerald-600" />
        <h1 className="text-4xl font-bold text-gray-800">Configurações e Gerenciamento do Plano</h1>
      </header>

      {/* Seção Metas Nutricionais */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center"><IconTarget className="mr-2" />Metas Nutricionais Diárias Globais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {nutrientFormFields.map(({key, label, unit, step}) => (
            <div key={key}>
              <label htmlFor={`target-${key}`} className="block text-sm font-medium text-gray-700">{label} ({unit})</label>
              <input
                type="number" id={`target-${key}`} name={key}
                value={currentTargetNutrients[key]}
                onChange={(e) => handleTargetNutrientChange(key, e.target.value)}
                step={step || "0.1"} min="0"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
            </div>
          ))}
        </div>
        <div className="mt-6 text-right">
            <Button onClick={handleSaveTargetNutrients} leftIcon={<IconSave />}>Salvar Metas Globais</Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Estas metas são usadas como referência no resumo nutricional diário do Planejador.</p>
      </section>

      {/* Seção Gerenciamento do Plano */}
      <section className="bg-white p-6 rounded-lg shadow-md space-y-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Gerenciamento do Plano de Dieta</h2>

        {/* Sub-seção Salvar Plano */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-3">Salvar Plano de Dieta Atual</h3>
          <p className="text-sm text-gray-600 mb-3">Salve o estado atual do seu planejador para um determinado período.</p>
          <Button onClick={handleOpenSaveModal} leftIcon={<IconSave />} variant="primary">Salvar Plano Atual no Histórico</Button>
        </div>

        {/* Sub-seção Exportar Plano */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-3">Exportar Plano de Dieta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
            <div>
              <label htmlFor="exportStartDate" className="block text-sm font-medium text-gray-700">Data Inicial</label>
              <input type="date" id="exportStartDate" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="exportEndDate" className="block text-sm font-medium text-gray-700">Data Final</label>
              <input type="date" id="exportEndDate" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleExportCSV} leftIcon={<IconDownload />} variant="ghost">Exportar para CSV</Button>
            <Button onClick={handleExportPDF} leftIcon={<IconFileText />} variant="ghost">Exportar para PDF/Imprimir</Button>
          </div>
        </div>

        {/* Sub-seção Importar Plano */}
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-xl font-medium text-gray-700 mb-3">Importar Plano de Dieta de CSV</h3>
             <div className="mb-3">
                <label htmlFor="importStrategy" className="block text-sm font-medium text-gray-700">Estratégia de Importação</label>
                <select id="importStrategy" value={importStrategy} onChange={(e) => setImportStrategy(e.target.value as 'replace' | 'merge')}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm">
                    <option value="merge">Mesclar com plano existente (sobrescreve dias importados)</option>
                    <option value="replace">Substituir plano existente pelos dias do CSV</option>
                </select>
            </div>
            <div className="flex items-end gap-2 mb-3">
                <div className="flex-grow">
                <label htmlFor="importDietCsvFile" className="block text-sm font-medium text-gray-700">Arquivo CSV da Dieta</label>
                <input type="file" id="importDietCsvFile" accept=".csv" onChange={handleImportFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
                </div>
                <Button onClick={handleImportDiet} disabled={!importCsvFile || isImporting} leftIcon={<IconUpload />}>
                  {isImporting ? 'Importando...' : 'Importar'}
                </Button>
            </div>
            <p className="text-xs text-gray-500 mb-2">Formato esperado do CSV: <code>{CSV_DIET_PLAN_HEADERS.join(', ')}</code>. Os IDs dos ingredientes/receitas devem corresponder aos existentes no sistema (ou nomes, se ID não encontrado).</p>
        </div>
      </section>

      {/* Modal para Salvar Plano */}
      <Modal isOpen={isSaveDietModalOpen} onClose={() => setIsSaveDietModalOpen(false)} title="Salvar Plano de Dieta Atual" size="lg">
        <div className="space-y-4">
            <div><label htmlFor="saveDietName" className="block text-sm font-medium text-gray-700">Nome do Plano</label><input type="text" id="saveDietName" value={saveDietName} onChange={(e) => setSaveDietName(e.target.value)} placeholder="Ex: Dieta Hipercalórica Verão" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" required/></div>
            <div><label htmlFor="saveDietDescription" className="block text-sm font-medium text-gray-700">Descrição (Opcional)</label><textarea id="saveDietDescription" value={saveDietDescription} onChange={(e) => setSaveDietDescription(e.target.value)} rows={2} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea></div>
            <div><label htmlFor="saveDietTags" className="block text-sm font-medium text-gray-700">Tags (Opcional, separadas por vírgula)</label><input type="text" id="saveDietTags" value={saveDietTags} onChange={(e) => setSaveDietTags(e.target.value)} placeholder="Ex: cutting, vegetariano, alta proteína" className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
            <div><label htmlFor="saveDietUserNotes" className="block text-sm font-medium text-gray-700">Notas Pessoais (Opcional)</label><textarea id="saveDietUserNotes" value={saveDietUserNotes} onChange={(e) => setSaveDietUserNotes(e.target.value)} rows={3} placeholder="Ex: Lembrar de beber mais água neste plano." className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"></textarea></div>
            <div className="grid grid-cols-2 gap-4">
                <div><label htmlFor="modalSaveDietStartDate" className="block text-sm font-medium text-gray-700">Data Inicial do Plano</label><input type="date" id="modalSaveDietStartDate" value={saveDietStartDate} onChange={(e) => setSaveDietStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
                <div><label htmlFor="modalSaveDietEndDate" className="block text-sm font-medium text-gray-700">Data Final do Plano</label><input type="date" id="modalSaveDietEndDate" value={saveDietEndDate} onChange={(e) => setSaveDietEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"/></div>
            </div>
            <p className="text-xs text-gray-500">O plano de refeições entre estas datas (inclusive) será salvo no histórico.</p>
        </div>
        <div className="mt-6 flex justify-end space-x-3"><Button variant="ghost" onClick={() => setIsSaveDietModalOpen(false)}>Cancelar</Button><Button onClick={handleSaveDiet}>Salvar Plano</Button></div>
      </Modal>
    </div>
  );
};

export default PlanSettingsPage;
