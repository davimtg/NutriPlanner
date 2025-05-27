
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { ShoppingListItem } from '../types';
import Button from '../components/Button';
import { IconShoppingCart, IconRefreshCw, IconSheet } from '../components/Icon'; // Adicionado IconSheet

interface LocalShoppingListItem extends ShoppingListItem {
  // purchased é herdado de ShoppingListItem, mas vamos gerenciá-lo localmente aqui.
}

const ShoppingListPage: React.FC = () => {
  const { getShoppingList } = useData();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  
  const [shoppingList, setShoppingList] = useState<LocalShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateList = useCallback(() => {
    setIsLoading(true);
    const list = getShoppingList(startDate, endDate);
    setShoppingList(
      list.map(item => ({
        ...item,
        purchased: item.purchased || false, // Mantém o estado de purchased se já existir no hook, senão false
      }))
    );
    setIsLoading(false);
  }, [getShoppingList, startDate, endDate]);
  
  useEffect(() => {
    generateList();
  }, [generateList]);

  const togglePurchased = (itemId: string) => {
    setShoppingList(prevList =>
      prevList.map(item =>
        item.ingredientId === itemId ? { ...item, purchased: !item.purchased } : item
      )
    );
  };
  
  const handleOpenSheetPage = () => {
    navigate(`/shopping-list-sheet?startDate=${startDate}&endDate=${endDate}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <IconShoppingCart className="w-10 h-10 text-emerald-600" />
          <h1 className="text-4xl font-bold text-gray-800">Lista de Compras</h1>
        </div>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4 md:flex md:items-end md:gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
        <Button onClick={generateList} disabled={isLoading} className="w-full md:w-auto" leftIcon={<IconRefreshCw />}>
          {isLoading ? 'Gerando...' : 'Atualizar Lista'}
        </Button>
      </div>

      {shoppingList.length > 0 && (
         <div className="text-center md:text-right">
            <Button onClick={handleOpenSheetPage} variant="primary" size="lg" leftIcon={<IconSheet />}>
                Abrir Planilha de Custos e Detalhes
            </Button>
        </div>
      )}


      {isLoading && <p className="text-center text-gray-600 py-8">Carregando lista...</p>}

      {!isLoading && shoppingList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IconShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Nenhum item na lista de compras para o período selecionado.</p>
          <p className="text-gray-500 mt-2">Planeje suas refeições para gerar a lista.</p>
        </div>
      )}

      {!isLoading && shoppingList.length > 0 && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-xl">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-6">Itens para Comprar</h2>
          <ul className="space-y-3">
            {shoppingList.map(item => (
              <li
                key={item.ingredientId}
                className={`p-3 rounded-md transition-all duration-200 ease-in-out flex items-center
                  ${item.purchased ? 'bg-gray-100 opacity-70' : 'bg-emerald-50 hover:bg-emerald-100'}`}
              >
                <input
                  type="checkbox"
                  id={`simple-item-${item.ingredientId}`}
                  checked={item.purchased}
                  onChange={() => togglePurchased(item.ingredientId)}
                  className="h-5 w-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-3 cursor-pointer flex-shrink-0"
                  aria-label={`Marcar ${item.ingredientName} como comprado`}
                />
                <label htmlFor={`simple-item-${item.ingredientId}`} className={`cursor-pointer flex-grow ${item.purchased ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                  <span className="font-medium">{item.ingredientName}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} {item.unit})
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
