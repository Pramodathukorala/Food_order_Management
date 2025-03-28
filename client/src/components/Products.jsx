import React, { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function Products() {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventories = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/inventories'); // Changed the endpoint
        const data = await res.json();
        console.log('Fetched data:', data); // Add logging to debug
        setInventories(data);
      } catch (error) {
        console.error("Error fetching inventories:", error);
      }
      setLoading(false);
    };

    fetchInventories();
  }, []);

  const addToCart = (inventory) => {
    const cartItem = {
      itemId: inventory._id,
      title: inventory.ItemName,
      price: inventory.UnitPrice,
      img: inventory.imageUrls?.[inventory.imageUrls.length - 1] || "/default-img.jpg",
      quantity: 1,
      size: "Default", // You can modify this based on your needs
      color: "Default"  // You can modify this based on your needs
    };

    // Get existing cart items
    const existingCart = JSON.parse(localStorage.getItem("cart")) || [];
    
    // Check if item already exists
    const existingItemIndex = existingCart.findIndex(item => item.itemId === cartItem.itemId);
    
    if (existingItemIndex !== -1) {
      existingCart[existingItemIndex].quantity += 1;
    } else {
      existingCart.push(cartItem);
    }

    // Save to localStorage
    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Navigate to cart page
    navigate("/cart");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 pt-24 lg:pt-16">
      {/* heading section */}
      <div>
        <h1 className="font-semibold text-4xl text-center text-ExtraDarkColor">
          Available Items
        </h1>
      </div>

      {/* Debug section - temporary */}
      <div className="text-center mb-4">
        {inventories.length === 0 && !loading && (
          <p>No items found</p>
        )}
      </div>

      {/* Cards section */}
      <div className="flex flex-wrap justify-center gap-5 pt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <FaSpinner className="animate-spin text-DarkColor text-5xl" />
          </div>
        ) : (
          inventories.map((inventory) => (
            <div 
              key={inventory._id}
              className="bg-white rounded-lg shadow-md p-4 w-[280px] hover:shadow-lg transition-shadow"
            >
              <img 
                src={inventory.imageUrls?.[inventory.imageUrls.length - 1] || "/default-img.jpg"}
                alt={inventory.ItemName}
                className="w-full h-[200px] object-cover rounded-t-lg mb-3"
              />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-ExtraDarkColor">{inventory.ItemName}</h3>
                <div className="text-sm text-gray-600">{inventory.description}</div>
                <div className="flex justify-between items-center">
                  <div className="text-DarkColor font-bold">
                    ${inventory.UnitPrice}
                  </div>
                  {inventory.Discount > 0 && (
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm">
                      {inventory.Discount}% Off
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className={`${
                    inventory.StockQuantity > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {inventory.StockQuantity > 0 
                      ? `In Stock (${inventory.StockQuantity})` 
                      : 'Out of Stock'
                    }
                  </span>
                  <span className="text-gray-500">{inventory.Category}</span>
                </div>
                <button 
                  className="w-full bg-DarkColor text-white py-2 rounded-md hover:bg-ExtraDarkColor transition-colors"
                  disabled={inventory.StockQuantity === 0}
                  onClick={() => addToCart(inventory)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
