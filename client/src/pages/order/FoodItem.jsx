import React, { useState, useEffect } from "react";
// ...existing imports...

const FoodItem = () => {
  const { id } = useParams();
  const { currentUser } = useSelector((state) => state.user);

  // State hooks
  const [foodItem, setFoodItem] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedPortion, setSelectedPortion] = useState("");
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState("medium");
  const [inventories, setInventories] = useState([]);

  // Fetch item data from backend API
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const response = await fetch(`/api/inventories/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch item data.");
        }
        const data = await response.json();
        setFoodItem(data);
        setSelectedPortion(data.Portions?.[0] || "Regular");
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  // Fetch recommended inventories
  useEffect(() => {
    const fetchInventories = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/inventories/search/get?limit=4` // Limiting the results
        );
        const data = await res.json();
        setInventories(data);
      } catch (error) {
        console.error("Error fetching inventories:", error);
      }
      setLoading(false);
    };

    fetchInventories();
  }, []);

  // Handle quantity changes
  const handleIncrease = () => setQuantity(quantity + 1);
  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!currentUser) {
      Swal.fire({
        title: "Please log in",
        text: "You need to log in to add items to the cart.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const cartItem = {
        userId: currentUser._id,
        itemId: id,
        title: foodItem.ItemName,
        img: foodItem.imageUrls[0] || "",
        price: foodItem.UnitPrice,
        quantity,
        portion: selectedPortion,
        spiceLevel: selectedSpiceLevel,
      };

      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart.push(cartItem);
      localStorage.setItem("cart", JSON.stringify(cart));

      Swal.fire({
        title: "Item added to cart successfully!",
        text: "Would you like to view your cart or add more items?",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "Go to Cart",
        cancelButtonText: "Add More",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/cart";
        }
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: "An error occurred while adding the item to the cart. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  // Handle portion and spice level changes
  const handlePortionChange = (e) => setSelectedPortion(e.target.value);
  const handleSpiceLevelChange = (e) => setSelectedSpiceLevel(e.target.value);

  // ...existing loading and error handling...

  // ...existing slider settings...

  return (
    <div>
      <Navbar />
      <div
        className="min-h-screen p-8 flex flex-col items-center"
        style={{ backgroundColor: "#ffffff" }}
      >
        <div className="w-3/4 flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-10 mt-16">
          <div className="w-full lg:w-1/2">
            <img
              className="rounded-xl w-full transition-transform duration-300 transform hover:scale-105"
              src={foodItem.imageUrls[0]}
              alt={foodItem.ItemName}
            />
          </div>
          <div className="w-full lg:w-1/2 space-y-6">
            <h1 className="text-4xl font-semibold">{foodItem.ItemName}</h1>
            <p className="text-lg text-gray-600">{foodItem.description}</p>
            <h2 className="text-2xl font-semibold">${foodItem.UnitPrice}</h2>
            <p className="text-md text-gray-500">
              Preparation Time: {foodItem.PrepTime || '20-30 mins'}
            </p>

            {/* Portion Size Selector */}
            <div className="space-y-2">
              <label className="block text-md font-medium">Select Portion:</label>
              <select
                value={selectedPortion}
                onChange={handlePortionChange}
                className="border border-gray-300 rounded px-3 py-2"
              >
                {foodItem.Portions?.map((portion) => (
                  <option key={portion} value={portion}>
                    {portion}
                  </option>
                )) || (
                  <>
                    <option value="Regular">Regular</option>
                    <option value="Large">Large</option>
                    <option value="Family">Family Size</option>
                  </>
                )}
              </select>
            </div>

            {/* Spice Level Selector */}
            <div className="space-y-2">
              <label className="block text-md font-medium">Spice Level:</label>
              <select
                value={selectedSpiceLevel}
                onChange={handleSpiceLevelChange}
                className="border border-gray-300 rounded px-3 py-2"
              >
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy</option>
                <option value="extra-spicy">Extra Spicy</option>
              </select>
            </div>

            {/* Quantity and Add to Cart Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleDecrease}
                className="px-4 py-2 bg-gray-200 rounded-full"
              >
                -
              </button>
              <span className="text-xl">{quantity}</span>
              <button
                onClick={handleIncrease}
                className="px-4 py-2 bg-gray-200 rounded-full"
              >
                +
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                className="px-6 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300"
              >
                Add to Cart
              </button>
              <button className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300">
                Order Now
              </button>
            </div>
          </div>
        </div>

        {/* Recommended Items Section */}
        <div className="w-full lg:w-5/6 mt-16 mb-14">
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: "#a98467" }}
          >
            You Might Also Like
          </h2>
          <Slider {...settings}>
            {inventories.map((item) => (
              <ProductCard
                key={item._id}
                id={item._id}
                img={item.imageUrls[0]}
                name={item.ItemName}
                price={item.UnitPrice}
                discount={item.DiscountPrice || " "}
              />
            ))}
          </Slider>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FoodItem;
