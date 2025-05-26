
import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { ShoppingListItem } from '../types';
import Button from '../components/Button';
import { IconShoppingCart } from '../components/Icon';

const ShoppingListPage: React.FC = () => {
  const { getShoppingList } = useData();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateList = () => {
    setIsLoading(true);
    // Simulate async operation if needed, or directly call
    const list = getShoppingList(startDate, endDate);
    setShoppingList(list.map(item => ({...item, purchased: item.purchased || false }))); // Ensure purchased is initialized
    setIsLoading(false);
  };
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    generateList();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]); // Removed getShoppingList from deps to avoid loop with useCallback if it changes too often

  const togglePurchased = (itemId: string) => {
    setShoppingList(prevList =>
      prevList.map(item =>
        item.ingredientId === itemId ? { ...item, purchased: !item.purchased } : item
      )
    );
  };

  const allPurchased = shoppingList.length > 0 && shoppingList.every(item => item.purchased);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-4xl font-bold text-gray-800">Lista de Compras</h1>
        <IconShoppingCart />
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
        <Button onClick={generateList} disabled={isLoading} className="w-full md:w-auto">
          {isLoading ? 'Gerando...' : 'Gerar Lista'}
        </Button>
      </div>

      {isLoading && <p className="text-center text-gray-600">Carregando lista...</p>}

      {!isLoading && shoppingList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600">Nenhum item na lista de compras para o período selecionado.</p>
          <p className="text-gray-500 mt-2">Planeje suas refeições para gerar a lista.</p>
        </div>
      )}

      {!isLoading && shoppingList.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-emerald-700 mb-6">Itens para Comprar</h2>
          {allPurchased && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-300">
              🎉 Todos os itens foram marcados como comprados!
            </div>
          )}
          <ul className="space-y-3">
            {shoppingList.map(item => (
              <li
                key={item.ingredientId}
                className={`flex items-center justify-between p-4 rounded-md transition-all duration-200 ease-in-out
                  ${item.purchased ? 'bg-gray-100 line-through text-gray-500 shadow-inner' : 'bg-emerald-50 hover:bg-emerald-100 shadow'}`}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={`item-${item.ingredientId}`}
                    checked={item.purchased}
                    onChange={() => togglePurchased(item.ingredientId)}
                    className="h-5 w-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mr-4 cursor-pointer"
                  />
                  <label htmlFor={`item-${item.ingredientId}`} className="cursor-pointer">
                    <span className="font-medium text-gray-800">{item.ingredientName}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      ({item.totalQuantity % 1 === 0 ? item.totalQuantity : item.totalQuantity.toFixed(2)} {item.unit})
                    </span>
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ShoppingListPage;
