import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
  const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCart: Product[] = [...cart];
      const productOnCart = newCart.find(product => product.id === productId);

      if (productOnCart) {
        const amount = productOnCart.amount + 1
        await updateProductAmount({productId, amount});
      } else {
        const responseProduct = await api.get(`products/${productId}`);
        const newProduct:Product = {
          ...responseProduct.data,
          amount: 1
        }
        newCart.push(newProduct);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);
      if (productIndex !== -1) {
        const newCart = [...cart];
        newCart.splice(productIndex, 1);
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        throw new Error(`Product with id ${productId} was not found!`);
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const newCart: Product[] = [...cart];
      const productOnCart = newCart.find(product => product.id === productId);

      if (productOnCart) {
        const responseStock = await api.get(`stock/${productId}`);
        const productStock: Stock = responseStock.data;
        if (amount <= 0 || productStock.amount < amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        
        productOnCart.amount = amount;
        setCart(newCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart));
      } else {
        throw new Error(`Product with id ${productId} was not found!`);
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
