import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { SketchPicker } from "react-color";
import { useNavigate, useParams } from "react-router-dom"; // Make sure to use this hook for navigation
import "tailwindcss/tailwind.css";
import { MdDeleteForever } from "react-icons/md";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../../firebase";

function UpdateInventory({ currentUser }) {
  const { id } = useParams();
  console.log("id", id);
  const [formData, setFormData] = useState({
    ItemName: "",
    Category: "Main Course",
    SKU: "",
    UnitPrice: "",
    description: "",
    StockQuantity: "",
    ReorderLevel: "",
    StockStatus: "In Stock",
    SupplierName: "",
    SupplierContact: "",
    imageUrls: [],
    expiryDate: "",
    nutritionalInfo: {
      calories: "",
      protein: "",
      carbs: "",
      fat: "",
    },
    allergenInfo: [],
    storageInstructions: "",
    Sizes: [],
    Colors: [], // Initialize Colors as empty array
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [sizeInput, setSizeInput] = useState(""); // State to manage size input
  const [colorInput, setColorInput] = useState(""); // State to manage color input
  const [fileUploadError, setFileUploadError] = useState(false); //A boolean to track if there's an error during file upload.
  const [filePerc, setFilePerc] = useState(0); // A number to track the upload progress of each file.
  const [uploading, setUploading] = useState(false); // A boolean to indicate if files are currently being uploaded.
  const [files, setFiles] = useState([]); // Initialize file state

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch(`/api/inventories/${id}`);
        const data = await res.json();
        // Format the expiry date to YYYY-MM-DD for the input field
        if (data.expiryDate) {
          data.expiryDate = new Date(data.expiryDate).toISOString().split("T")[0];
        }
        setFormData(data);
      } catch (error) {
        console.error("Error fetching inventories:", error);
      }
    };
    fetchInventory();
  }, []);

  const handleImageSubmit = (e) => {
    if (
      (files ?? []).length > 0 &&
      (files ?? []).length + formData.imageUrls.length < 4
    ) {
      setUploading(true);
      setFileUploadError(false);
      const promises = [];

      for (let i = 0; i < files.length; i++) {
        promises.push(storeImage(files[i]));
      }
      Promise.all(promises)
        .then((urls) => {
          setFormData({
            ...formData,
            imageUrls: formData.imageUrls.concat(urls),
          });
          setFileUploadError(false);
          setUploading(false);
        })
        .catch((err) => {
          setFileUploadError(
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: "Image upload failed (2MB max)",
            })
          );
          setUploading(false);
        });
    } else {
      setFileUploadError(
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "You can upload max 6 images",
        })
      );
      setUploading(false);
    }
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);
      const fileName = new Date().getTime() + file.name;
      const storageRef = ref(storage, `productImages/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setFilePerc(Math.round(progress));
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        }
      );
    });
  };

  const handleremoveImage = (index) => {
    setFormData({
      ...formData,
      imageUrls: formData.imageUrls.filter((_, i) => i !== index),
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "SupplierContact") {
      // Validate that SupplierContact contains only digits and has a maximum of 10 digits
      if (/^\d*$/.test(value) && value.length <= 10) {
        setFormData({ ...formData, [name]: value });
      } else {
        Swal.fire({
          icon: "error",
          title: "Invalid Input",
          text: "Supplier Contact must be a number and contain up to 10 digits.",
        });
      }
    } else if (name.startsWith("nutritionalInfo.")) {
      const key = name.split(".")[1];
      setFormData((prevState) => ({
        ...prevState,
        nutritionalInfo: {
          ...prevState.nutritionalInfo,
          [key]: value,
        },
      }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setFormData({ ...formData, imageUrls: [...formData.imageUrls, ...urls] });
    localStorage.setItem(
      "uploadedImages",
      JSON.stringify([...formData.imageUrls, ...urls])
    ); // Save to local storage
  };

  // Function to handle size addition
  const handleAddSize = () => {
    if (sizeInput && !formData.Sizes.includes(sizeInput)) {
      setFormData((prevState) => ({
        ...prevState,
        Sizes: [...prevState.Sizes, sizeInput],
      }));
      setSizeInput(""); // Reset input field
    }
  };

  // Function to handle size removal
  const handleRemoveSize = (size) => {
    setFormData((prevState) => ({
      ...prevState,
      Sizes: prevState.Sizes.filter((s) => s !== size),
    }));
  };

  // Function to handle color addition
  const handleAddColor = (color) => {
    if (color && !formData.Colors?.includes(color.hex)) { // Add optional chaining
      setFormData((prevState) => ({
        ...prevState,
        Colors: [...(prevState.Colors || []), color.hex], // Add null check
      }));
    }
  };

  // Function to handle color removal
  const handleRemoveColor = (color, e) => {
    e.preventDefault(); // Prevent form submission when clicking the remove button
    setFormData((prevState) => ({
      ...prevState,
      Colors: (prevState.Colors || []).filter((c) => c !== color), // Add null check
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.ReorderLevel <= 0) {
        // Reorder Level must be greater than zero
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Reorder Level must be greater than zero.",
        });
        setLoading(false);
        return;
      }

      if (formData.StockQuantity < 0) {
        // Stock Quantity must be greater than or equal to zero
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Stock Quantity must be greater than zero.",
        });
        setLoading(false);
        return;
      }

      if (formData.UnitPrice <= 0) {
        //price must be greater than 0. if not display error msj
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Price must be greater than zero.",
        });
        return;
      }

      const res = await fetch(`/api/inventories/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (data.success === false) {
        setError(data.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: `${data.message}`,
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Inventory added successfully",
        });
        navigate(`/manager/inventory-management`); // Navigate to the newly created inventory item
      }
    } catch (error) {
      setError(error.message);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: `${error.message}`,
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-10 bg-PrimaryColor rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-ExtraDarkColor mb-6">
        Update Inventory
      </h1>
      <form onSubmit={handleSubmit} className="flex-1 grid-cols-2">
        {/* Item Name */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Item Name
          </label>
          <input
            type="text"
            name="ItemName"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.ItemName}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Category
          </label>
          <select
            name="Category"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.Category}
            onChange={handleInputChange}
            required
          >
            <option value="Main Course">Main Course</option>
            <option value="Appetizers">Appetizers</option>
            <option value="Desserts">Desserts</option>
            <option value="Beverages">Beverages</option>
            <option value="Side Dishes">Side Dishes</option>
          </select>
        </div>

        {/* Expiry Date */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Expiry Date
          </label>
          <input
            type="date"
            name="expiryDate"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.expiryDate || ""}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Nutritional Information */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Nutritional Information
          </label>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              name="nutritionalInfo.calories"
              placeholder="Calories"
              className="p-2 border border-SecondaryColor rounded"
              value={formData.nutritionalInfo.calories}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="nutritionalInfo.protein"
              placeholder="Protein (g)"
              className="p-2 border border-SecondaryColor rounded"
              value={formData.nutritionalInfo.protein}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="nutritionalInfo.carbs"
              placeholder="Carbs (g)"
              className="p-2 border border-SecondaryColor rounded"
              value={formData.nutritionalInfo.carbs}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="nutritionalInfo.fat"
              placeholder="Fat (g)"
              className="p-2 border border-SecondaryColor rounded"
              value={formData.nutritionalInfo.fat}
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* Storage Instructions */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Storage Instructions
          </label>
          <textarea
            name="storageInstructions"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.storageInstructions}
            onChange={handleInputChange}
          ></textarea>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.description}
            onChange={handleInputChange}
            required
          ></textarea>
        </div>

        {/* Stock Quantity */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Stock Quantity
          </label>
          <input
            type="number"
            name="StockQuantity"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.StockQuantity}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Reorder Level */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Reorder Level
          </label>
          <input
            type="number"
            name="ReorderLevel"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.ReorderLevel}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Stock Status */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Stock Status
          </label>
          <select
            name="StockStatus"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.StockStatus}
            onChange={handleInputChange}
            required
          >
            <option value="In Stock">In Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        {/* Supplier Name */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Supplier Name
          </label>
          <input
            type="text"
            name="SupplierName"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.SupplierName}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Supplier Contact */}
        <div className="mb-4">
          <label className="block text-DarkColor font-medium mb-2">
            Supplier Contact
          </label>
          <input
            type="text"
            name="SupplierContact"
            className="w-full p-2 border border-SecondaryColor rounded"
            value={formData.SupplierContact}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Image Upload */}
        <div className="flex flex-col flex-1 gap-4">
          <p className="font-semibold">
            Images:
            <span className="font-normal text-gray-600 ml-2">
              The first image will be the cover (max 3)
            </span>
          </p>
          <div className="flex gap-4">
            <input
              onChange={(e) => setFiles(e.target.files)}
              type="file"
              className="p-3 border border-blue-700 rounded w-full"
              id="images"
              accept="image/*"
              multiple
            />
            <button
              type="button"
              onClick={handleImageSubmit}
              className="p-3 text-blue-700 border border-blue-700 rounded uppercase hover:shadow-xl disabled:opacity-80"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
          <p className="text-sm self-center font-semibold">
            {fileUploadError ? (
              <span className="text-red-700">Error image upload</span>
            ) : filePerc > 0 && filePerc < 100 ? (
              <span className="text-slate-700">{`Uploading ${filePerc}%`}</span>
            ) : filePerc === 100 ? (
              <span className="text-green-700">
                Image upload successfully!!
              </span>
            ) : (
              ""
            )}
          </p>
          {formData.imageUrls &&
            formData.imageUrls.map((url, index) => (
              <div
                key={url}
                className="flex justify-between p-3 border border-blue-700 items-center"
              >
                <img
                  src={url}
                  alt="pkg images"
                  className="w-24 h-24 object-contain rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleremoveImage(index)}
                  className="text-red-700 text-5xl font-extrabold rounded-lg uppercase hover:opacity-60"
                >
                  <MdDeleteForever />
                </button>
              </div>
            ))}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full p-2 mt-4 bg-DarkColor text-white rounded hover:bg-ExtraDarkColor transition"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}

export default UpdateInventory;
