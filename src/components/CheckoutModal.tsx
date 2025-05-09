import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/contexts/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  cartItems: CartItem[];
  cartTotal: number;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  cartItems,
  cartTotal,
}: CheckoutModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm Your Order</DialogTitle>
          <DialogDescription>
            Please review your order details before confirming
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] mt-4">
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartId}
                className="flex items-start border-b border-hko-border pb-4"
              >
                <div className="h-16 w-16 rounded-md overflow-hidden">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="font-medium text-hko-text-primary">
                    {item.productName}
                  </h4>
                  <div className="text-sm text-hko-text-secondary mt-1">
                    Quantity: {item.quantity}
                  </div>
                  <div className="text-sm font-medium text-hko-text-primary mt-1">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex flex-col gap-4 mt-6">
          <div className="flex justify-between items-center py-4 border-t border-hko-border">
            <span className="text-lg font-semibold text-hko-text-primary">
              Total Amount
            </span>
            <span className="text-lg font-semibold text-hko-text-primary">
              ₱{cartTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <DialogFooter className="flex justify-center mt-4">
          <p className="text-center text-lg text-hko-text-primary">
            Please proceed to mobile to complete your order
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
