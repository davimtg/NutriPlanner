
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { ShoppingListItem, ManualShoppingListItem as ManualShoppingListItemType, ShoppingListTemplate } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { IconShoppingCart, IconRefreshCw, IconSheet, IconPlus, IconTrash, IconCopy, IconSave, IconLayoutList } from '../components/Icon';
import { generateId } from '../utils/idGenerator';
import { useGlobalToast } from '../App'; 

interface LocalShoppingListItem extends ShoppingListItem {
  // purchased is inherited
}
interface FullShoppingListItem extends Partial<LocalShoppingListItem>, Partial<ManualShoppingListItemType> {
  isManual: boolean; 
  id: string; 
  name: string; 
  purchased: boolean;
  category: string;
  ingredientId?: string;
  totalQuantity?: number;
  unit?: string;
}


const ShoppingListPage: React.FC = () => {
  const { getShoppingList, shoppingListTemplates, addShoppingListTemplate, deleteShoppingListTemplate, loadShoppingListTemplate } = useData();
  const { addToast } = useGlobalToast();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  
  const [generatedList, setGeneratedList] = useState<LocalShoppingListItem[]>([]);
  const [manualItems, setManualItems] = useState<ManualShoppingListItemType[]>(() => {
    const savedManualItems = localStorage.getItem('nutriplanner_manualShoppingItems');
    return savedManualItems ? JSON.parse(savedManualItems) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Outros'); 

  // For templates
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoadTemplateModalOpen, setIsLoadTemplateModalOpen] = useState(false);


  useEffect(() => {
    localStorage.setItem('nutriplanner_manualShoppingItems', JSON.stringify(manualItems));
  }, [manualItems]);


  const generateList = useCallback(() => {
    setIsLoading(true);
    const list = getShoppingList(startDate, endDate);
    setGeneratedList(
      list.map(item => ({
        ...item,
        purchased: item.purchased || false, 
      }))
    );
    setIsLoading(false);
  }, [getShoppingList, startDate, endDate]);
  
  useEffect(() => {
    generateList();
  }, [generateList]);

  const combinedList: FullShoppingListItem[] = useMemo(() => {
    const list: FullShoppingListItem[] = [];
    generatedList.forEach(item => list.push({
        ...item,
        id: item.ingredientId,
        name: item.ingredientName,
        isManual: false,
        category: item.category || 'Outros'
    }));
    manualItems.forEach(item => list.push({
        ...item,
        isManual: true,
        category: item.category || 'Outros'
    }));
    return list.sort((a,b) => (a.category || 'zz').localeCompare(b.category || 'zz') || a.name.localeCompare(b.name));
  }, [generatedList, manualItems]);


  const togglePurchased = (itemId: string, isManualItem: boolean) => {
    if (isManualItem) {
      setManualItems(prev => prev.map(item => item.id === itemId ? { ...item, purchased: !item.purchased } : item));
    } else {
      setGeneratedList(prev => prev.map(item => item.ingredientId === itemId ? { ...item, purchased: !item.purchased } : item));
    }
  };
  
  const handleOpenAddItemModal = () => {
    setNewItemName('');
    setNewItemCategory('Outros');
    setIsAddItemModalOpen(true);
  };

  const handleAddManualItem = () => {
    if (!newItemName.trim()) {
      addToast("Nome do item não pode ser vazio.", "error");
      return;
    }
    setManualItems(prev => [...prev, { id: generateId(), name: newItemName.trim(), purchased: false, category: newItemCategory }]);
    setIsAddItemModalOpen(false);
    addToast(`"${newItemName.trim()}" adicionado à lista.`, "success");
  };

  const handleDeleteManualItem = (id: string) => {
    setManualItems(prev => prev.filter(item => item.id !== id));
    addToast("Item manual removido.", "info");
  }

  const handleMarkCategoryAsPurchased = (category: string, purchaseState: boolean) => {
    setGeneratedList(prev => prev.map(item => item.category === category ? { ...item, purchased: purchaseState } : item));
    setManualItems(prev => prev.map(item => item.category === category ? { ...item, purchased: purchaseState } : item));
  };
  
  const handleClearPurchased = () => {
    setGeneratedList(prev => prev.filter(item => !item.purchased));
    setManualItems(prev => prev.filter(item => !item.purchased));
    addToast("Itens comprados removidos da lista.", "success");
  };

  const handleExportToText = () => {
    if (combinedList.length === 0) {
      addToast("Lista de compras está vazia.", "warning");
      return;
    }
    let textOutput = `Lista de Compras (${startDate} a ${endDate}):\n\n`;
    const categories = [...new Set(combinedList.map(item => item.category || 'Outros'))].sort();

    categories.forEach(category => {
      textOutput += `--- ${category} ---\n`;
      combinedList.filter(item => (item.category || 'Outros') === category).forEach(item => {
        const prefix = item.purchased ? "[x] " : "[ ] ";
        textOutput += `${prefix}${item.name}`;
        if (!item.isManual && item.totalQuantity && item.unit) {
          textOutput += ` (${item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} ${item.unit})`;
        }
        textOutput += "\n";
      });
      textOutput += "\n";
    });

    navigator.clipboard.writeText(textOutput)
      .then(() => addToast("Lista copiada para a área de transferência!", "success"))
      .catch(() => addToast("Erro ao copiar lista.", "error"));
  };


  const handleOpenSheetPage = () => {
    navigate(`/shopping-list-sheet?startDate=${startDate}&endDate=${endDate}`);
  };

  const groupedByCategory = useMemo(() => {
    const groups: { [category: string]: FullShoppingListItem[] } = {};
    combinedList.forEach(item => {
      const cat = item.category || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.entries(groups).sort(([catA], [catB]) => catA.localeCompare(catB));
  }, [combinedList]);

  // Template functions
  const handleOpenSaveTemplateModal = () => {
    if (manualItems.length === 0) {
      addToast("Não há itens manuais para salvar como template.", "warning");
      return;
    }
    setTemplateName(`Template - ${new Date().toLocaleDateString('pt-BR')}`);
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      addToast("Nome do template não pode ser vazio.", "error");
      return;
    }
    addShoppingListTemplate(templateName, manualItems);
    addToast(`Template "${templateName}" salvo com sucesso!`, "success");
    setIsSaveTemplateModalOpen(false);
    setTemplateName('');
  };

  const handleLoadTemplate = (templateId: string) => {
    const itemsToLoad = loadShoppingListTemplate(templateId);
    if (itemsToLoad) {
      if (manualItems.length > 0 && !confirm("Isso substituirá seus itens manuais atuais. Deseja continuar?")) {
        return;
      }
      setManualItems(itemsToLoad);
      addToast("Template carregado!", "success");
    } else {
      addToast("Template não encontrado.", "error");
    }
    setIsLoadTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (templateId: string, templateName: string) => {
    if (confirm(`Tem certeza que deseja excluir o template "${templateName}"?`)) {
      deleteShoppingListTemplate(templateId);
      addToast(`Template "${templateName}" excluído.`, "info");
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <IconShoppingCart className="w-10 h-10 text-emerald-600" />
          <h1 className="text-4xl font-bold text-gray-800">Lista de Compras</h1>
        </div>
        <Button onClick={handleOpenAddItemModal} leftIcon={<IconPlus />} variant="primary">
            Adicionar Item Manual
        </Button>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 md:flex md:items-end md:gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
          <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
        </div>
        <Button onClick={generateList} disabled={isLoading} className="w-full md:w-auto" leftIcon={<IconRefreshCw />}>
          {isLoading ? 'Gerando...' : 'Atualizar Lista'}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleExportToText} variant="ghost" leftIcon={<IconCopy/>}>Copiar Lista (Texto)</Button>
        <Button onClick={handleClearPurchased} variant="danger" leftIcon={<IconTrash/>}>Limpar Comprados</Button>
        {combinedList.length > 0 && (
            <Button onClick={handleOpenSheetPage} variant="ghost" leftIcon={<IconSheet />}>
                Abrir Planilha de Custos
            </Button>
        )}
        <Button onClick={handleOpenSaveTemplateModal} variant="ghost" leftIcon={<IconSave />}>Salvar Itens Manuais como Template</Button>
        {shoppingListTemplates.length > 0 && (
            <Button onClick={() => setIsLoadTemplateModalOpen(true)} variant="ghost" leftIcon={<IconLayoutList />}>Carregar Template</Button>
        )}
      </div>


      {isLoading && <p className="text-center text-gray-600 py-8">Carregando lista...</p>}

      {!isLoading && combinedList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Nenhum item na lista de compras para o período selecionado.</p>
          <p className="text-gray-500 mt-2">Planeje suas refeições ou adicione itens manualmente para gerar a lista.</p>
        </div>
      )}

      {!isLoading && combinedList.length > 0 && (
        groupedByCategory.map(([category, items]) => (
            <div key={category} className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-emerald-700">{category} ({items.length})</h2>
                    <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => handleMarkCategoryAsPurchased(category, true)}>Marcar Tudo</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleMarkCategoryAsPurchased(category, false)}>Desmarcar Tudo</Button>
                    </div>
                </div>
                <ul className="space-y-3">
                    {items.map(item => (
                    <li key={item.id}
                        className={`p-3 rounded-md transition-all duration-200 ease-in-out flex items-center justify-between
                        ${item.purchased ? 'bg-gray-100 opacity-70' : 'bg-emerald-50 hover:bg-emerald-100'}`}>
                        <div className="flex items-center flex-grow">
                        <input type="checkbox" id={`item-${item.id}`} checked={item.purchased}
                            onChange={() => togglePurchased(item.id, item.isManual)}
                            className="h-5 w-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-3 cursor-pointer flex-shrink-0"
                            aria-label={`Marcar ${item.name} como comprado`}/>
                        <label htmlFor={`item-${item.id}`} className={`cursor-pointer flex-grow ${item.purchased ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            <span className="font-medium">{item.name}</span>
                            {!item.isManual && item.totalQuantity && item.unit && (
                            <span className="text-sm text-gray-600 ml-2">
                                ({item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} {item.unit})
                            </span>
                            )}
                        </label>
                        </div>
                        {item.isManual && (
                            <Button variant="danger" size="sm" onClick={() => handleDeleteManualItem(item.id)} aria-label={`Remover ${item.name}`}>
                                <IconTrash/>
                            </Button>
                        )}
                    </li>
                    ))}
                </ul>
            </div>
        ))
      )}
       <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} title="Adicionar Item Manual à Lista">
            <div className="space-y-4">
                <div>
                    <label htmlFor="newItemName" className="block text-sm font-medium text-gray-700">Nome do Item</label>
                    <input type="text" id="newItemName" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Ex: Papel Toalha"/>
                </div>
                <div>
                    <label htmlFor="newItemCategory" className="block text-sm font-medium text-gray-700">Categoria</label>
                    <input type="text" id="newItemCategory" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Ex: Limpeza, Higiene"/>
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setIsAddItemModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleAddManualItem}>Adicionar Item</Button>
            </div>
        </Modal>

        <Modal isOpen={isSaveTemplateModalOpen} onClose={() => setIsSaveTemplateModalOpen(false)} title="Salvar Template de Lista de Compras">
            <p className="text-sm text-gray-600 mb-2">Salvar os {manualItems.length} itens manuais atuais como um template reutilizável.</p>
            <div>
                <label htmlFor="templateName" className="block text-sm font-medium text-gray-700">Nome do Template</label>
                <input 
                    type="text" 
                    id="templateName" 
                    value={templateName} 
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ex: Compras Semanais Básicas"
                />
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setIsSaveTemplateModalOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveTemplate}>Salvar Template</Button>
            </div>
        </Modal>

        <Modal isOpen={isLoadTemplateModalOpen} onClose={() => setIsLoadTemplateModalOpen(false)} title="Carregar Template de Lista de Compras" size="md">
            {shoppingListTemplates.length === 0 ? (
                <p>Nenhum template salvo.</p>
            ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto">
                    {shoppingListTemplates.map(template => (
                        <li key={template.id} className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50">
                            <div>
                                <p className="font-medium text-gray-800">{template.name}</p>
                                <p className="text-xs text-gray-500">{template.items.length} itens - Salvo em: {new Date(template.createdAt).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="flex space-x-2">
                                <Button size="sm" onClick={() => handleLoadTemplate(template.id)}>Carregar</Button>
                                <Button size="sm" variant="danger" onClick={() => handleDeleteTemplate(template.id, template.name)}><IconTrash /></Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="mt-6 text-right">
                <Button variant="ghost" onClick={() => setIsLoadTemplateModalOpen(false)}>Fechar</Button>
            </div>
        </Modal>

    </div>
  );
};

export default ShoppingListPage;