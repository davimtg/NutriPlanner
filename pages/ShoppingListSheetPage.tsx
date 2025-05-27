
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { ShoppingListItem } from '../types';
import Button from '../components/Button';
import { IconShoppingCart, IconRefreshCw, IconArrowUp, IconArrowDown } from '../components/Icon';

interface SheetShoppingListItem extends ShoppingListItem {
  desiredQuantity: number;
  unitPrice: number;
  category: string; // Setor
  // 'purchased' aqui significa selecionado para cálculo parcial
}

type SortableSheetKeys = 'category' | 'ingredientName' | 'totalQuantity' | 'unitPrice' | 'desiredQuantity' | 'subtotal';
type SortDirection = 'asc' | 'desc';

const ShoppingListSheetPage: React.FC = () => {
  const { getShoppingList } = useData();
  const [searchParams] = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams.get('startDate') || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || (() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  })());
  
  const [sheetList, setSheetList] = useState<SheetShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: SortableSheetKeys; direction: SortDirection } | null>(null);


  const generateSheetList = useCallback(() => {
    setIsLoading(true);
    const baseList = getShoppingList(startDate, endDate);
    setSheetList(
      baseList.map(item => ({
        ...item,
        desiredQuantity: item.totalQuantity,
        unitPrice: 0,
        category: item.category || 'Outros', 
        purchased: false, 
      }))
    );
    setSortConfig(null); // Reset sort on new list generation
    setIsLoading(false);
  }, [getShoppingList, startDate, endDate]);
  
  useEffect(() => {
    generateSheetList();
  }, [generateSheetList]);

  const handleFieldChange = (itemId: string, field: keyof SheetShoppingListItem, value: string | number | boolean) => {
    setSheetList(prevList =>
      prevList.map(item => {
        if (item.ingredientId === itemId) {
          if (field === 'desiredQuantity' || field === 'unitPrice') {
            const numValue = parseFloat(value as string);
            return { ...item, [field]: isNaN(numValue) || numValue < 0 ? 0 : numValue };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const sortedSheetList = useMemo(() => {
    let sortableItems = [...sheetList];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === 'subtotal') {
            valA = a.unitPrice * a.desiredQuantity;
            valB = b.unitPrice * b.desiredQuantity;
        } else {
            valA = a[sortConfig.key];
            valB = b[sortConfig.key];
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [sheetList, sortConfig]);

  const requestSort = (key: SortableSheetKeys) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableSheetKeys) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <IconArrowDown className="w-3 h-3 ml-1 opacity-30" />; // Default or inactive
    }
    return sortConfig.direction === 'asc' ? <IconArrowUp className="w-3 h-3 ml-1" /> : <IconArrowDown className="w-3 h-3 ml-1" />;
  };


  const selectedForPartialCalc = useMemo(() => {
    return sheetList.filter(item => item.purchased); 
  }, [sheetList]);

  const partialTotal = useMemo(() => {
    return selectedForPartialCalc.reduce((acc, item) => acc + (item.desiredQuantity * item.unitPrice), 0);
  }, [selectedForPartialCalc]);

  const getCategoryColor = (category: string) => {
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash; 
    }
    const colors = [
      'bg-green-100 text-green-800', 'bg-blue-100 text-blue-800', 'bg-yellow-100 text-yellow-800', 
      'bg-purple-100 text-purple-800', 'bg-pink-100 text-pink-800', 'bg-indigo-100 text-indigo-800',
      'bg-red-100 text-red-800', 'bg-gray-100 text-gray-800', 'bg-teal-100 text-teal-800', 'bg-orange-100 text-orange-800'
    ];
    return colors[Math.abs(hash) % colors.length];
  };


  const columnHeaders: { key: SortableSheetKeys; label: string; className?: string }[] = [
    { key: 'category', label: 'Setor', className: "w-32" },
    { key: 'ingredientName', label: 'Produto' },
    { key: 'totalQuantity', label: 'Qtd. Prev.', className: "w-24" },
    { key: 'unitPrice', label: 'Preço Unit. (R$)', className: "w-28" },
    { key: 'desiredQuantity', label: 'Qtd. Desej.', className: "w-24" },
    { key: 'subtotal', label: 'Subtotal Item (R$)', className: "w-32" },
  ];


  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
         <div className="flex items-center gap-3">
            <IconShoppingCart className="w-10 h-10 text-emerald-600" />
            <h1 className="text-4xl font-bold text-gray-800">Planilha de Compras Detalhada</h1>
        </div>
         <Button onClick={generateSheetList} disabled={isLoading} leftIcon={<IconRefreshCw />}>
          {isLoading ? 'Atualizando...' : 'Atualizar Planilha'}
        </Button>
      </header>
      <p className="text-sm text-gray-600">
        Período da lista: {new Date(startDate + "T00:00:00").toLocaleDateString('pt-BR')} - {new Date(endDate + "T00:00:00").toLocaleDateString('pt-BR')}
      </p>

      {isLoading && <p className="text-center text-gray-600 py-8">Carregando planilha...</p>}

      {!isLoading && sheetList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Nenhum item na lista para este período.</p>
        </div>
      )}

      {!isLoading && sheetList.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-grow lg:w-2/3 bg-white p-4 rounded-lg shadow-xl overflow-x-auto">
            <h2 className="text-xl font-semibold text-emerald-700 mb-4">Itens da Lista ({sortedSheetList.length})</h2>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {columnHeaders.map(header => (
                    <th 
                        key={header.key} 
                        scope="col"
                        className={`px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${header.className || ''}`}
                        onClick={() => requestSort(header.key)}
                    >
                        <div className="flex items-center">
                            {header.label}
                            {getSortIcon(header.key)}
                        </div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider w-16">Sel.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedSheetList.map(item => (
                  <tr key={item.ingredientId}>
                    <td className="px-1 py-2 whitespace-nowrap">
                        <input 
                            type="text" 
                            value={item.category}
                            onChange={(e) => handleFieldChange(item.ingredientId, 'category', e.target.value)}
                            className={`w-full p-1 border-0 rounded text-xs ${getCategoryColor(item.category)} focus:ring-1 focus:ring-emerald-500`}
                            aria-label={`Setor de ${item.ingredientName}`}
                        />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900" title={item.ingredientName}>{item.ingredientName}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} {item.unit}
                    </td>
                    <td className="px-1 py-2 whitespace-nowrap">
                      <input 
                        type="number" 
                        value={item.unitPrice}
                        onChange={(e) => handleFieldChange(item.ingredientId, 'unitPrice', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                        step="0.01" min="0"
                        aria-label={`Preço unitário de ${item.ingredientName}`}
                      />
                    </td>
                    <td className="px-1 py-2 whitespace-nowrap">
                      <input 
                        type="number" 
                        value={item.desiredQuantity}
                        onChange={(e) => handleFieldChange(item.ingredientId, 'desiredQuantity', e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-500"
                        step={item.unit === 'unidade' ? "1" : "0.1"} min="0"
                        aria-label={`Quantidade desejada de ${item.ingredientName}`}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-700 font-semibold">
                      R$ {(item.unitPrice * item.desiredQuantity).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <input 
                        type="checkbox"
                        checked={item.purchased} 
                        onChange={(e) => handleFieldChange(item.ingredientId, 'purchased', e.target.checked)}
                        className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        aria-label={`Selecionar ${item.ingredientName} para cálculo parcial`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:w-1/3 bg-gray-50 p-4 rounded-lg shadow-xl space-y-3 self-start">
            <h2 className="text-xl font-semibold text-emerald-700">Cálculo Parcial</h2>
            <div className="p-3 bg-emerald-600 text-white rounded-md text-center">
              <p className="text-sm">Total Parcial</p>
              <p className="text-2xl font-bold">R$ {partialTotal.toFixed(2)}</p>
            </div>
            {selectedForPartialCalc.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">Selecione itens na lista para ver o cálculo parcial.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                {selectedForPartialCalc.map(item => (
                  <div key={`partial-${item.ingredientId}`} className="bg-white p-2 rounded shadow-sm text-xs">
                    <p className="font-medium text-gray-700 truncate" title={item.ingredientName}>{item.ingredientName}</p>
                    <div className="flex justify-between text-gray-600">
                      <span>R$ {item.unitPrice.toFixed(2)} x {item.desiredQuantity % 1 === 0 ? item.desiredQuantity : item.desiredQuantity.toFixed(2)} {item.unit}</span>
                      <span className="font-semibold">R$ {(item.unitPrice * item.desiredQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingListSheetPage;
