import React, { useState, useEffect } from "react";
import axios from "axios";
import { useProducts, Product } from "@/contexts/ProductContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  ShoppingCart, 
  Filter,
  ChevronDown,
  LogOut
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const StudentView = () => {
  const { logout } = useAuth();
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const { products, isLoading } = useProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [tempQuantities, setTempQuantities] = useState<Record<number, number>>({});
  const [updateTimers, setUpdateTimers] = useState<Record<number, NodeJS.Timeout>>({});
  
  // Calculate max price for filter
  const maxPrice = Math.max(...products.map(product => product.price), 0);

  useEffect(() => {
    if (!isLoading) {
      // Initialize price range based on products
      setPriceRange([0, Math.ceil(maxPrice)]);
    }
  }, [isLoading, maxPrice]);

  // Extract all unique categories
  const categories = ["All", ...new Set(products.map(product => product.category))];

  // Handle filtering
  useEffect(() => {
    if (!isLoading) {
      let filtered = [...products];

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(
          product =>
            product.productName.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term)
        );
      }

      // Filter by category
      if (selectedCategory && selectedCategory !== "All") {
        filtered = filtered.filter(
          product => product.category === selectedCategory
        );
      }

      // Filter by price range
      filtered = filtered.filter(product => {
        return product.price >= priceRange[0] && product.price <= priceRange[1];
      });

      // Filter by in stock
      if (inStockOnly) {
        filtered = filtered.filter(product => product.quantity > 0 && product.available);
      }

      setFilteredProducts(filtered);
    }
  }, [isLoading, products, searchTerm, selectedCategory, priceRange, inStockOnly]);

  const { cart, isLoading: isCartLoading, fetchCart } = useCart();
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * (tempQuantities[item.cartId] ?? item.quantity), 
    0
  );

  const addToCart = async (product: Product) => {
    try {
      setLoadingProductId(product.productId);
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        toast.error("Please login to add items to cart");
        return;
      }

      await axios.post(`${baseUrl}/user/cart`, {
        productId: product.productId,
        email: localStorage.getItem('email'),
        quantity: 1,
        price: product.price,
        ordered: false
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      await fetchCart();
      toast.success(`Added ${product.productName} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Failed to add item to cart. Please try again.");
    } finally {
      setLoadingProductId(null);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setPriceRange([0, Math.ceil(maxPrice)]);
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen bg-hko-background">
      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-6">
            <h1 className="text-3xl font-bold text-hko-text-primary">
              Student Store
            </h1>
            <p className="text-hko-text-secondary mt-1">
              Browse and purchase items from our inventory
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-subtle border border-hko-border p-4 mb-6 sticky top-16 z-10">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-hko-text-muted" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-hko-text-muted hover:text-hko-text-primary" />
                  </button>
                )}
              </div>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center space-x-2">
                {/* Category Filter */}
                <Accordion type="single" collapsible className="w-[200px]">
                  <AccordionItem value="categories" className="border-0">
                    <AccordionTrigger className="py-2 px-3 bg-hko-white rounded-md text-sm hover:no-underline hover:bg-hko-white/80">
                      <span className="flex items-center">
                        <Filter className="h-4 w-4 mr-2" />
                        Categories
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="absolute bg-white mt-1 p-2 rounded-md shadow-elevation-1 border border-hko-border z-20">
                      <div className="space-y-1">
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category === "All" ? "" : category)}
                            className={`text-sm py-1.5 px-3 rounded-md w-full text-left transition-colors ${
                              (category === "All" && !selectedCategory) || category === selectedCategory
                                ? "bg-hko-primary text-white"
                                : "hover:bg-hko-secondary"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Price Filter */}
                <Accordion type="single" collapsible className="w-[200px]">
                  <AccordionItem value="price" className="border-0">
                    <AccordionTrigger className="py-2 px-3 bg-hko-white rounded-md text-sm hover:no-underline hover:bg-hko-white/80">
                      <span className="flex items-center">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Price Range
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="absolute bg-white mt-1 p-4 rounded-md shadow-elevation-1 border border-hko-border z-20 w-[250px]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">₱{priceRange[0]}</span>
                          <span className="text-sm font-medium">₱{priceRange[1]}</span>
                        </div>
                        <Slider
                          value={priceRange}
                          min={0}
                          max={Math.ceil(maxPrice)}
                          step={1}
                          onValueChange={setPriceRange}
                        />
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="in-stock"
                            checked={inStockOnly}
                            onCheckedChange={setInStockOnly}
                          />
                          <Label htmlFor="in-stock">In stock only</Label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Clear Filters */}
                {(searchTerm || selectedCategory || inStockOnly || priceRange[0] > 0 || priceRange[1] < Math.ceil(maxPrice)) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-hko-text-muted hover:text-hko-text-primary"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Mobile Filters Button */}
              <div className="md:hidden">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsMobileFilterOpen(true)}
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedCategory || inStockOnly || priceRange[0] > 0 || priceRange[1] < Math.ceil(maxPrice)) && (
                    <Badge variant="secondary" className="ml-2">Active</Badge>
                  )}
                </Button>
              </div>

              {/* Cart and Logout Buttons */}
              <div className="flex gap-2">
                <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span>Cart</span>
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md">
                  <SheetHeader>
                    <SheetTitle>Your Cart</SheetTitle>
                    <SheetDescription>
                      Review your items before checkout
                    </SheetDescription>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-220px)] mt-6 -mx-6 px-6">
                    {cart.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCart className="h-12 w-12 mx-auto text-hko-text-muted mb-4" />
                        <p className="text-hko-text-secondary">Your cart is empty</p>
                        <SheetClose asChild>
                          <Button variant="link" className="mt-2">
                            Continue Shopping
                          </Button>
                        </SheetClose>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {cart.map((item) => (
                          <div key={item.cartId} className="flex border-b border-hko-border pb-4">
                            <div className="h-16 w-16 rounded bg-hko-secondary flex-shrink-0 overflow-hidden">
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-hko-text-primary">{item.productName}</h4>
                                <button
                                  onClick={async () => {
                                    try {
                                      const authToken = localStorage.getItem('token');
                                      if (!authToken) {
                                        toast.error("Please login");
                                        return;
                                      }

                                      await axios.delete(`${baseUrl}/user/cart/${item.cartId}`, {
                                        headers: {
                                          Authorization: `Bearer ${authToken}`,
                                        },
                                      });
                                      await fetchCart();
                                    } catch (error) {
                                      console.error('Error removing item:', error);
                                      toast.error("Failed to remove item");
                                    }
                                  }}
                                  className="text-hko-text-muted hover:text-red-500"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="text-sm text-hko-text-secondary mt-1">
                                <span>₱{item.price.toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-full"
                                    onClick={() => {
                                      if (item.quantity <= 1) return;
                                      
                                      const newQuantity = (tempQuantities[item.cartId] ?? item.quantity) - 1;
                                      setTempQuantities(prev => ({ ...prev, [item.cartId]: newQuantity }));
                                      
                                      // Clear existing timer if any
                                      if (updateTimers[item.cartId]) {
                                        clearTimeout(updateTimers[item.cartId]);
                                      }
                                      
                                      // Set new timer for this cart item
                                      const timer = setTimeout(async () => {
                                        try {
                                          const authToken = localStorage.getItem('token');
                                          if (!authToken) {
                                            toast.error("Please login");
                                            return;
                                          }

                                          await axios.post(`${baseUrl}/user/cart`, {
                                            productId: item.productId,
                                            email: localStorage.getItem('email'),
                                            quantity: newQuantity,
                                            price: item.price,
                                            ordered: false
                                          }, {
                                            headers: {
                                              Authorization: `Bearer ${authToken}`,
                                              'Content-Type': 'application/json',
                                            },
                                          });
                                          
                                          await fetchCart();
                                          // Clear temp quantity after successful update
                                          setTempQuantities(prev => {
                                            const newTemp = { ...prev };
                                            delete newTemp[item.cartId];
                                            return newTemp;
                                          });
                                        } catch (error) {
                                          console.error('Error updating quantity:', error);
                                          toast.error("Failed to update quantity");
                                          // Reset temp quantity on error
                                          setTempQuantities(prev => {
                                            const newTemp = { ...prev };
                                            delete newTemp[item.cartId];
                                            return newTemp;
                                          });
                                        }
                                        // Clear timer reference
                                        setUpdateTimers(prev => {
                                          const newTimers = { ...prev };
                                          delete newTimers[item.cartId];
                                          return newTimers;
                                        });
                                      }, 3000);
                                      
                                      // Save timer reference
                                      setUpdateTimers(prev => ({
                                        ...prev,
                                        [item.cartId]: timer
                                      }));
                                    }}
                                    disabled={item.quantity <= 1}
                                  >
                                    <span className="sr-only">Decrease</span>
                                    <span>-</span>
                                  </Button>
                                  <span className="text-sm font-medium w-6 text-center">
                                    {tempQuantities[item.cartId] ?? item.quantity}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6 rounded-full"
                                    onClick={() => {
                                      const newQuantity = (tempQuantities[item.cartId] ?? item.quantity) + 1;
                                      setTempQuantities(prev => ({ ...prev, [item.cartId]: newQuantity }));
                                      
                                      // Clear existing timer if any
                                      if (updateTimers[item.cartId]) {
                                        clearTimeout(updateTimers[item.cartId]);
                                      }
                                      
                                      // Set new timer for this cart item
                                      const timer = setTimeout(async () => {
                                        try {
                                          const authToken = localStorage.getItem('token');
                                          if (!authToken) {
                                            toast.error("Please login");
                                            return;
                                          }

                                          await axios.post(`${baseUrl}/user/cart`, {
                                            productId: item.productId,
                                            email: localStorage.getItem('email'),
                                            quantity: newQuantity,
                                            price: item.price,
                                            ordered: false
                                          }, {
                                            headers: {
                                              Authorization: `Bearer ${authToken}`,
                                              'Content-Type': 'application/json',
                                            },
                                          });
                                          
                                          await fetchCart();
                                          // Clear temp quantity after successful update
                                          setTempQuantities(prev => {
                                            const newTemp = { ...prev };
                                            delete newTemp[item.cartId];
                                            return newTemp;
                                          });
                                        } catch (error) {
                                          console.error('Error updating quantity:', error);
                                          toast.error("Failed to update quantity");
                                          // Reset temp quantity on error
                                          setTempQuantities(prev => {
                                            const newTemp = { ...prev };
                                            delete newTemp[item.cartId];
                                            return newTemp;
                                          });
                                        }
                                        // Clear timer reference
                                        setUpdateTimers(prev => {
                                          const newTimers = { ...prev };
                                          delete newTimers[item.cartId];
                                          return newTimers;
                                        });
                                      }, 3000);
                                      
                                      // Save timer reference
                                      setUpdateTimers(prev => ({
                                        ...prev,
                                        [item.cartId]: timer
                                      }));
                                    }}
                                  >
                                    <span className="sr-only">Increase</span>
                                    <span>+</span>
                                  </Button>
                                </div>
                                <span className="font-medium">
                                ₱{(item.price * (tempQuantities[item.cartId] ?? item.quantity)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <SheetFooter className="mt-6 sm:mt-0">
                    <div className="space-y-4 w-full">
                      <div className="flex justify-between py-4 border-t border-hko-border">
                        <span className="font-semibold text-hko-text-primary">Total</span>
                        <span className="font-semibold text-hko-text-primary">
                        ₱{cartTotal.toFixed(2)}
                        </span>
                      </div>
              <Button 
                className="w-full" 
                disabled={cart.length === 0}
                onClick={async () => {
                  try {
                    const authToken = localStorage.getItem('token');
                    if (!authToken) {
                      toast.error("Please login to checkout");
                      return;
                    }

                    await axios.post(`${baseUrl}/user/order`, {}, {
                      headers: {
                        Authorization: `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    await fetchCart();
                    toast.success("Order placed successfully!");
                  } catch (error) {
                    console.error('Error during checkout:', error);
                    toast.error("Failed to place order. Please try again.");
                  }
                }}
              >
                Checkout
              </Button>
                    </div>
                  </SheetFooter>
                </SheetContent>
                </Sheet>
                
                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  onClick={logout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Logout</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Filter Sheet */}
          <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
            <SheetContent side="bottom" className="h-[80vh]">
              <SheetHeader className="text-left">
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>
                  Narrow down your product search
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100%-140px)] mt-6">
                <div className="space-y-6 px-1">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Categories
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category === "All" ? "" : category)}
                          className={`text-sm py-2 px-3 rounded-md text-left transition-colors ${
                            (category === "All" && !selectedCategory) || category === selectedCategory
                              ? "bg-hko-primary text-white"
                              : "bg-hko-secondary hover:bg-hko-secondary/80"
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Price Range
                    </h3>
                    <div className="px-2 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">${priceRange[0]}</span>
                        <span className="text-sm">${priceRange[1]}</span>
                      </div>
                      <Slider
                        value={priceRange}
                        min={0}
                        max={Math.ceil(maxPrice)}
                        step={1}
                        onValueChange={setPriceRange}
                      />
                    </div>
                  </div>

                  {/* Stock Options */}
                  <div>
                    <h3 className="text-sm font-medium mb-3">Availability</h3>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="mobile-in-stock"
                        checked={inStockOnly}
                        onCheckedChange={setInStockOnly}
                      />
                      <Label htmlFor="mobile-in-stock">In stock only</Label>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <SheetFooter className="flex-row justify-between space-x-4 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    clearFilters();
                    setIsMobileFilterOpen(false);
                  }}
                >
                  Reset All
                </Button>
                <SheetClose asChild>
                  <Button className="flex-1">Apply Filters</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Active Filters Display */}
          {(selectedCategory || inStockOnly || priceRange[0] > 0 || priceRange[1] < Math.ceil(maxPrice)) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory && (
                <Badge variant="secondary" className="px-3 py-1.5 text-xs">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("")}
                    className="ml-2 inline-flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {(priceRange[0] > 0 || priceRange[1] < Math.ceil(maxPrice)) && (
                <Badge variant="secondary" className="px-3 py-1.5 text-xs">
                  ${priceRange[0]} - ${priceRange[1]}
                  <button
                    onClick={() => setPriceRange([0, Math.ceil(maxPrice)])}
                    className="ml-2 inline-flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {inStockOnly && (
                <Badge variant="secondary" className="px-3 py-1.5 text-xs">
                  In Stock Only
                  <button
                    onClick={() => setInStockOnly(false)}
                    className="ml-2 inline-flex items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-7 text-hko-text-muted hover:text-hko-text-primary"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg border border-hko-border h-64 animate-pulse"
                ></div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-20 h-20 bg-hko-secondary rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-hko-text-muted" />
                </div>
                <h3 className="text-lg font-medium text-hko-text-primary mb-2">
                  No products found
                </h3>
                <p className="text-hko-text-secondary max-w-md mx-auto">
                  Try adjusting your filters or search term to find what you're looking for.
                </p>
                <Button
                  variant="link"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.productId}
                  product={product}
                  onAddToCart={() => addToCart(product)}
                  className="h-full"
                  isLoading={loadingProductId === product.productId}
                />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentView;
