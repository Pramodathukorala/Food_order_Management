import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css"; // Import SimpleBar styles

const EditOrderPopup = ({ order, onClose, onUpdate }) => {
  const [customer, setCustomer] = useState(order.customerInfo || {});
  const [delivery, setDelivery] = useState(order.deliveryInfo || {});
  const [items, setItems] = useState(order.items || []);
  const [status, setStatus] = useState(order.status || "Pending");
  const [errors, setErrors] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? "Invalid email address" : "";
      case "mobile":
        const phoneRegex = /^\d{10}$/;
        return !phoneRegex.test(value) ? "Phone number must be 10 digits" : "";
      default:
        return "";
    }
  };

  const handleInputChange = (e, field, isCustomer = true) => {
    const { name, value } = e.target;
    if (isCustomer) {
      setCustomer({ ...customer, [name]: value });
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setDelivery({ ...delivery, [name]: value });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
  };

  const handleUpdate = async () => {
    const emailError = validateField("email", customer.email);
    const mobileError = validateField("mobile", customer.mobile);

    if (emailError || mobileError) {
      setErrors({
        ...errors,
        email: emailError,
        mobile: mobileError,
      });
      return;
    }

    try {
      const updatedOrder = {
        ...order,
        customerInfo: customer,
        deliveryInfo: delivery,
        items: items,
        status: status,
      };

      const response = await axios.put(
        `/api/order/update/${order._id}`,
        updatedOrder
      );

      onUpdate(response.data);
      Swal.fire("Success", "Order updated successfully", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to update order", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="p-6 rounded-lg max-w-3xl w-full"
        initial={{ y: "-100vh", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "-100vh", opacity: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
      >
        <SimpleBar style={{ maxHeight: "80vh", width: "100%" }}>
          <div className="bg-PrimaryColor rounded-lg shadow-lg p-8 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-darkColor">Edit Order</h2>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="p-2 border border-secondaryColor rounded"
              >
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="Ready">Ready</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2 text-darkColor">
                  Customer Information
                </h3>
                <input
                  type="text"
                  name="name"
                  value={customer.name || ""}
                  onChange={(e) => handleInputChange(e, "name")}
                  className="w-full p-3 border border-secondaryColor rounded mb-2"
                  placeholder="Name"
                />
                <input
                  type="email"
                  name="email"
                  value={customer.email || ""}
                  onChange={(e) => handleInputChange(e, "email")}
                  className={`w-full p-3 border rounded mb-1 ${
                    errors.email ? "border-red-500" : "border-secondaryColor"
                  }`}
                  placeholder="Email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mb-2">{errors.email}</p>
                )}
                <input
                  type="text"
                  name="mobile"
                  value={customer.mobile || ""}
                  onChange={(e) => handleInputChange(e, "mobile")}
                  className={`w-full p-3 border rounded mb-1 ${
                    errors.mobile ? "border-red-500" : "border-secondaryColor"
                  }`}
                  placeholder="Mobile"
                />
                {errors.mobile && (
                  <p className="text-red-500 text-sm mb-2">{errors.mobile}</p>
                )}
              </div>

              {delivery && delivery.address && (
                <div>
                  <h3 className="font-semibold mb-2 text-darkColor">
                    Delivery Information
                  </h3>
                  <input
                    type="text"
                    name="address"
                    value={delivery.address || ""}
                    onChange={(e) => handleInputChange(e, "address", false)}
                    className="w-full p-3 border border-secondaryColor rounded mb-2"
                    placeholder="Address"
                  />
                  <input
                    type="text"
                    name="city"
                    value={delivery.city || ""}
                    onChange={(e) => handleInputChange(e, "city", false)}
                    className="w-full p-3 border border-secondaryColor rounded mb-2"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    name="postalCode"
                    value={delivery.postalCode || ""}
                    onChange={(e) => handleInputChange(e, "postalCode", false)}
                    className="w-full p-3 border border-secondaryColor rounded mb-2"
                    placeholder="Postal Code"
                  />
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2 text-darkColor">Order Items</h3>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-secondaryColor p-4 mb-4 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-darkColor">
                      {item.title}
                    </h4>
                    <span className="text-darkColor font-medium">
                      ${(item.price * (item.quantity || 1)).toFixed(2)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity || 1}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "quantity",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full p-2 border border-secondaryColor rounded"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">
                        Special Instructions:
                      </label>
                      <textarea
                        value={item.instructions || ""}
                        onChange={(e) =>
                          handleItemChange(index, "instructions", e.target.value)
                        }
                        className="w-full p-2 border border-secondaryColor rounded"
                        placeholder="E.g., No spice, extra sauce"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="text-right mt-4">
                <span className="text-xl font-bold text-darkColor">
                  Total: ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleUpdate}
                className="bg-DarkColor hover:bg-ExtraDarkColor text-white px-6 py-3 rounded"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="bg-SecondaryColor hover:bg-red-400 text-darkColor px-6 py-3 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </SimpleBar>
      </motion.div>
    </div>
  );
};

export default EditOrderPopup;
