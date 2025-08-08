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
  const { getShoppingList, shoppingListTemplates, addShoppingListTemplate, deleteShoppingListTemplate, loadShoppingListTemplate, sectors } = useData();
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
  const [newItemCategory, setNewItemCategory] = useState(sectors.length > 0 ? sectors[0] : 'Outros'); 

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
    setNewItemCategory(sectors.length > 0 ? sectors[0] : 'Outros');
    setIsAddItemModalOpen(true);
  };

  const handleAddManualItem = () => {
    if (!newItemName.trim()) {
      addToast("Nome do item não pode ser vazio.", "error");
      return;
    }
    setManualItems(prev => [...prev, { id: generateId(), name: newItemName.trim(), purchased: false, category: newItemCategory.trim() || 'Outros' }]);
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
    let textOutput = `Lista de Compras (${new Date(startDate+"T00:00:00").toLocaleDateString('pt-BR')} a ${new Date(endDate+"T00:00:00").toLocaleDateString('pt-BR')}):\n\n`;
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

  if (isLoading && combinedList.length === 0) { // Show loader only on initial load or full refresh
    return (
      <div className="flex justify-center items-center h-64">
        <div role="status" className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Carregando...</span>
        </div>
        <p className="ml-3 text-slate-700 text-lg">Gerando lista de compras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <IconShoppingCart className="w-10 h-10 text-emerald-600" />
          <h1 className="text-4xl font-bold text-slate-800">Lista de Compras</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleOpenAddItemModal} leftIcon={<IconPlus />} variant="primary">Adicionar Item Manual</Button>
          <Button onClick={handleOpenSheetPage} leftIcon={<IconLayoutList />} variant="ghost">Ver Planilha Detalhada</Button>
        </div>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">Data Inicial</label>
            <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">Data Final</label>
            <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500" />
          </div>
          <Button onClick={generateList} disabled={isLoading} leftIcon={<IconRefreshCw className={isLoading ? 'animate-spin' : ''} />} className="w-full md:w-auto">
            {isLoading ? 'Atualizando...' : 'Atualizar Lista'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200">
            <Button onClick={handleExportToText} leftIcon={<IconCopy />} variant="ghost" size="sm">Copiar Lista (Texto)</Button>
            <Button onClick={handleClearPurchased} variant="ghost" size="sm" leftIcon={<IconTrash />}>Limpar Comprados</Button>
            <Button onClick={() => setIsSaveTemplateModalOpen(true)} leftIcon={<IconSave />} variant="ghost" size="sm">Salvar como Modelo</Button>
            <Button onClick={() => setIsLoadTemplateModalOpen(true)} leftIcon={<IconLayoutList />} variant="ghost" size="sm">Carregar Modelo</Button>
        </div>
      </div>
      
      {combinedList.length === 0 && !isLoading && (
        <div className="text-center py-10 bg-white rounded-xl shadow-lg">
          <IconShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-xl text-slate-600">Sua lista de compras está vazia.</p>
          <p className="text-slate-500 mt-2">Gere a lista com base no seu plano ou adicione itens manualmente.</p>
        </div>
      )}

      {groupedByCategory.map(([category, items]) => (
        <div key={category} className="bg-white p-5 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold text-emerald-700">{category}</h2>
            <div className="space-x-2">
              <Button size="sm" variant="ghost" onClick={() => handleMarkCategoryAsPurchased(category, true)}>Marcar Todos</Button>
              <Button size="sm" variant="ghost" onClick={() => handleMarkCategoryAsPurchased(category, false)}>Desmarcar Todos</Button>
            </div>
          </div>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item.id} className={`flex items-center justify-between p-3 rounded-md transition-all duration-200 ${item.purchased ? 'bg-slate-200 ' : 'bg-slate-50 hover:bg-slate-100'}`}>
                <label htmlFor={`item-${item.id}`} className="flex items-center cursor-pointer flex-grow min-w-0"> {/* Added min-w-0 for better truncation */}
                  <input
                    type="checkbox"
                    id={`item-${item.id}`}
                    checked={item.purchased}
                    onChange={() => togglePurchased(item.id, item.isManual)}
                    className="h-5 w-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 mr-3 flex-shrink-0"
                  />
                  <span className={`text-sm truncate ${item.purchased ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>
                    {item.name}
                    {!item.isManual && item.totalQuantity && item.unit && (
                      <span className="text-xs text-slate-500 ml-1.5 whitespace-nowrap">({item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} {item.unit})</span>
                    )}
                  </span>
                </label>
                {item.isManual && (
                  <Button variant="danger" size="sm" onClick={() => handleDeleteManualItem(item.id)} aria-label={`Excluir ${item.name}`} className="ml-2 flex-shrink-0">
                    <IconTrash />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <Modal isOpen={isAddItemModalOpen} onClose={() => setIsAddItemModalOpen(false)} title="Adicionar Item Manual à Lista">
        <div className="space-y-4">
          <div>
            <label htmlFor="newItemName" className="block text-sm font-medium text-slate-700">Nome do Item</label>
            <input type="text" id="newItemName" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="newItemCategory" className="block text-sm font-medium text-slate-700">Categoria/Setor</label>
            <select id="newItemCategory" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm bg-white">
              {sectors.sort().map(sector => <option key={sector} value={sector}>{sector}</option>)}
              <option value="Outros">Outros</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsAddItemModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleAddManualItem}>Adicionar Item</Button>
        </div>
      </Modal>
      
      <Modal isOpen={isSaveTemplateModalOpen} onClose={() => setIsSaveTemplateModalOpen(false)} title="Salvar Lista como Modelo">
        <div>
          <label htmlFor="templateName" className="block text-sm font-medium text-slate-700">Nome do Modelo</label>
          <input type="text" id="templateName" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm" />
        </div>
        <p className="text-xs text-slate-500 mt-2">Salvará os itens manuais atuais como um modelo reutilizável.</p>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={() => setIsSaveTemplateModalOpen(false)}>Cancelar</Button>
          <Button onClick={() => {
            if (!templateName.trim()) { addToast("Nome do modelo não pode ser vazio.", "error"); return; }
            addShoppingListTemplate(templateName, manualItems.map(it => ({...it, id: generateId()})));
            addToast(`Modelo "${templateName}" salvo!`, "success");
            setIsSaveTemplateModalOpen(false);
            setTemplateName('');
          }}>Salvar Modelo</Button>
        </div>
      </Modal>

      <Modal isOpen={isLoadTemplateModalOpen} onClose={() => setIsLoadTemplateModalOpen(false)} title="Carregar Modelo de Lista">
        {shoppingListTemplates.length === 0 ? (
            <p className="text-slate-600">Nenhum modelo salvo.</p>
        ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
                {shoppingListTemplates.map(template => (
                    <li key={template.id} className="flex justify-between items-center p-2 hover:bg-slate-100 rounded-md">
                        <span className="text-slate-700">{template.name} <span className="text-xs text-slate-500">({template.items.length} itens)</span></span>
                        <div className="space-x-1">
                          <Button size="sm" onClick={() => {
                              const itemsToLoad = loadShoppingListTemplate(template.id);
                              if (itemsToLoad) {
                                  setManualItems(prev => [...prev, ...itemsToLoad.map(it => ({...it, id: generateId(), purchased: false})) ]);
                                  addToast(`Modelo "${template.name}" carregado e adicionado à lista.`, "success");
                              }
                              setIsLoadTemplateModalOpen(false);
                          }}>Carregar</Button>
                          <Button size="sm" variant="danger" onClick={() => {
                            if (confirm(`Excluir modelo "${template.name}"?`)) {
                              deleteShoppingListTemplate(template.id);
                              addToast(`Modelo "${template.name}" excluído.`, "info");
                            }
                          }}><IconTrash/></Button>
                        </div>
                    </li>
                ))}
            </ul>
        )}
        <div className="mt-6 flex justify-end">
            <Button variant="ghost" onClick={() => setIsLoadTemplateModalOpen(false)}>Fechar</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ShoppingListPage;
