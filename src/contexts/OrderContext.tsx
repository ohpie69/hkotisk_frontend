import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import axios from "axios"
import type { Order, OrderResponse } from "@/types/order"

const baseUrl = import.meta.env.VITE_BASE_URL
const wsURL = import.meta.env.VITE_WS_URL

interface OrderContextType {
  orders: Order[]
  isLoading: boolean
  error: string | null
  updateOrderStatus: (orderId: number, status: string, email: string) => Promise<void>
  fetchOrders: () => Promise<void>
}

const OrderContext = createContext<OrderContextType | undefined>(undefined)

export function OrderProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = localStorage.getItem("token")

  const fetchOrders = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)
    

    try {
      const response = await axios.get<OrderResponse>(`${baseUrl}/staff/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrders(response.data.orderlist)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch orders"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [token, toast])

  const updateOrderStatus = async (orderId: number, orderStatus: string, email: string) => {
    if (!token) return

    // Find the current order
    const currentOrder = orders.find(order => order.orderId === orderId);
    if (!currentOrder) {
      throw new Error("Order not found");
    }

    // Prevent status changes if order is completed or cancelled
    if (currentOrder.orderStatus === "completed" || currentOrder.orderStatus === "cancelled") {
      throw new Error(`Cannot change status of ${currentOrder.orderStatus} order`);
    }

    // Prevent reverting from processing to pending
    if (currentOrder.orderStatus === "processing" && orderStatus === "pending") {
      throw new Error("Cannot revert processing order back to pending");
    }

    try {
      await axios.post(
        `${baseUrl}/staff/order`,
        { orderId, email, orderStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      toast({
        title: "Success",
        description: `Order #${orderId} status updated to ${orderStatus}`
      })
      
      await fetchOrders()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update order status"
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      })
      throw error
    }
  }

  useEffect(() => {
    if (!token) return
    
    fetchOrders()

    let socket: WebSocket;
    let reconnectAttempt = 0;
    const maxReconnectAttempts = 5;
    
    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsEndpoint = `${protocol}//localhost:8080/ws/orders`;
      socket = new WebSocket(wsEndpoint);
      
      // Send authentication token immediately after connection
      socket.onopen = () => {
        console.log('WebSocket connection established');
        socket.send(JSON.stringify({ type: 'auth', token }));
        reconnectAttempt = 0; // Reset reconnect attempts on successful connection
      };

      socket.onmessage = () => {
        fetchOrders(); // Refresh orders on updates
      };

      socket.onerror = (error) => {
        console.error('WebSocket error: ', error);
      };

      socket.onclose = () => {
        if (reconnectAttempt < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 10000);
          console.log(`WebSocket connection closed. Attempting to reconnect in ${timeout}ms`);
          setTimeout(() => {
            reconnectAttempt++;
            connectWebSocket();
          }, timeout);
        }
        // Silently handle connection failure without showing error modal
      };
    };

    connectWebSocket();

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [token, fetchOrders, toast])

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading,
      error,
      updateOrderStatus,
      fetchOrders
    }}>
      {children}
    </OrderContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrderContext)
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider")
  }
  return context
}
