'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext(null);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.id === action.payload.id);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            i.id === action.payload.id
              ? { ...i, cantidad: i.cantidad + 1 }
              : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.payload, cantidad: 1 }] };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => i.id !== action.payload) };

    case 'UPDATE_CANTIDAD': {
      if (action.payload.cantidad <= 0) {
        return { ...state, items: state.items.filter(i => i.id !== action.payload.id) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.payload.id ? { ...i, cantidad: action.payload.cantidad } : i
        ),
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    case 'OPEN_CART':
      return { ...state, isOpen: true };

    case 'CLOSE_CART':
      return { ...state, isOpen: false };

    default:
      return state;
  }
};

const initialState = {
  items: [],
  isOpen: false,
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const totalItems = state.items.reduce((sum, i) => sum + i.cantidad, 0);
  const totalPrecio = state.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

  const addItem    = (producto) => { dispatch({ type: 'ADD_ITEM', payload: producto }); dispatch({ type: 'OPEN_CART' }); };
  const removeItem = (id)       => dispatch({ type: 'REMOVE_ITEM', payload: id });
  const updateCantidad = (id, cantidad) => dispatch({ type: 'UPDATE_CANTIDAD', payload: { id, cantidad } });
  const clearCart  = ()         => dispatch({ type: 'CLEAR_CART' });
  const toggleCart = ()         => dispatch({ type: 'TOGGLE_CART' });
  const openCart   = ()         => dispatch({ type: 'OPEN_CART' });
  const closeCart  = ()         => dispatch({ type: 'CLOSE_CART' });

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      totalItems,
      totalPrecio,
      addItem,
      removeItem,
      updateCantidad,
      clearCart,
      toggleCart,
      openCart,
      closeCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider');
  return context;
}
