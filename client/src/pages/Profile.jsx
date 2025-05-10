import { useSelector, useDispatch } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { app } from "../firebase";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import {
  updateUserstart,
  updateUserFailure,
  updateUserSuccess,
  deleteUserFailure,
  deleteUserstart,
  deleteUserSuccess,
  signOutUserstart,
  signOutUserFailure,
  signOutUserSuccess,
} from "../redux/user/userSlice";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { IoMdArrowRoundBack } from "react-icons/io";
import { FaUserEdit, FaTrash, FaCheckCircle, FaSpinner } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import * as tf from "@tensorflow/tfjs";

export default function Profile() {
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const fileRef = useRef(null);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({
    username: currentUser.username,
    height: currentUser.height,
    weight: currentUser.weight,
    bmi: currentUser.bmi,
  });
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const dispatch = useDispatch();
  const [bmi, setBmi] = useState();
  const [healthStatus, setHealthStatus] = useState("");
  const [foods, setFoods] = useState(null);
  const [nutrients, setNutrients] = useState([]);
  const [healthIssues, setHealthIssues] = useState("");

  //model loading
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [prediction, setPrediction] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const imageRef = useRef();
  const fileInputRef = useRef();

  const [dietPlansName, setDietPlansName] = useState([]);
  const [dietPlansDescription, setDietPlansDescription] = useState([]);

  // Add prediction specific states
  const [predictionImage, setPredictionImage] = useState(null);
  const [predictionResult, setPredictionResult] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const predictionInputRef = useRef(null);
  const [nutritionData, setNutritionData] = useState(null);

  // Add base URL constant
  const API_BASE_URL = 'http://localhost:3000'; // Update this to match your backend URL

  //use effect function to load the model when first rendering the web page
  useEffect(() => {
    loadModel();
    setPrediction([]);
    setImageURL(null);
    setNutrients([]);
    setHealthIssues("");
    setDietPlansName([]);
    setDietPlansDescription([]);
    // eslint-disable-next-line
  }, []);

  //load model function
  const loadModel = async () => {
    setIsModelLoading(true);
    try {
      const loadedModel = await tf.loadLayersModel(
        "https://raw.githubusercontent.com/Sathmikasenadheera01/mltesting/master/zodoofoodclassification_model_tfjs/model.json"
      );
      console.log("Model loaded successfully");
      setModel(loadedModel);
      return loadedModel;
    } catch (error) {
      console.error("Error loading model:", error);
      throw new Error("Failed to load model");
    } finally {
      setIsModelLoading(false);
    }
  };

  //upload image function
  const uploadImage = (e) => {
    const { files } = e.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setImageURL(url);
    } else {
      setImageURL(null);
    }
  };

  // Add image upload handler
  const handlePredictionImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPredictionImage(imageUrl);
      setPredictionResult("");
    }
  };

  // Modified predict function with model check
  const predict = async (img) => {
    let modelToUse = model;
    if (!modelToUse) {
      console.log("Model not found, loading model...");
      modelToUse = await loadModel();
    }

    if (!modelToUse) {
      throw new Error("Could not load model");
    }

    try {
      const foodList = [
        "apple_pie",
        "cheesecake",
        "chicken_curry",
        "chicken_wings",
        "chocolate_cake",
        "chocolate_mousse",
        "club_sandwich",
        "donuts",
        "fish_and_chips",
        "french_fries",
        "french_toast",
        "fried_rice",
        "frozen_yogurt",
        "garlic_bread",
        "greek_salad",
        "hamburger",
        "hot_dog",
        "ice_cream",
        "lasagna",
        "macaroni_and_cheese",
        "omelette",
        "pancakes",
        "pizza",
        "ramen",
        "samosa",
        "shrimp_and_grits",
        "spaghetti_carbonara",
        "spring_rolls",
        "steak",
        "strawberry_shortcake",
        "sushi",
        "tacos",
        "waffles",
      ];

      const tensor = tf.tidy(() => {
        return tf.browser
          .fromPixels(img)
          .resizeNearestNeighbor([299, 299])
          .toFloat()
          .div(tf.scalar(255))
          .expandDims();
      });

      const predictions = await modelToUse.predict(tensor).array();
      tensor.dispose();

      console.log("Predictions:", predictions);

      if (!predictions || !predictions[0] || Math.max(...predictions[0]) < 0.7) {
        setPredictionResult("Cannot identify this image correctly");
        return;
      }

      const predictedClassIndex = predictions[0].indexOf(Math.max(...predictions[0]));
      const predictedFood = foodList[predictedClassIndex];
      const finalPrediction = predictedFood.replace(/_/g, " ");
      setPredictionResult(finalPrediction);

      // Call nutrition API after prediction
      const nutritionInfo = await apiCall(finalPrediction);
      if (nutritionInfo && nutritionInfo.foods) {
        setNutritionData(nutritionInfo.foods[0]);
      }
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  };

  // Modified handlePredict function
  const handlePredict = async () => {
    if (!predictionImage) return;

    setIsPredicting(true);
    try {
      const img = await loadImage(predictionImage);
      await predict(img);
    } catch (error) {
      console.error("Prediction failed:", error);
      setPredictionResult(error.message || "Failed to process image");
      Swal.fire({
        icon: 'error',
        title: 'Prediction Failed',
        text: error.message || "Failed to process image"
      });
    } finally {
      setIsPredicting(false);
    }
  };

  // image preprocessing
  const loadImage = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        resolve(img);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  //api call to get nutrients
  const apiCall = async (foodQuery) => {
    try {
      const response = await fetch(
        "https://trackapi.nutritionix.com/v2/natural/nutrients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-app-id": "d11e2b85",
            "x-app-key": "0d432fc21d533c492dc7967e56a4d0b4",
          },
          body: JSON.stringify({
            query: foodQuery,
            timezone: "US/Eastern",
          }),
        }
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Nutrition API error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch nutrition information'
      });
    }
  };

  useEffect(() => {
    if (file) {
      handleFileUpload(file);
    }
  }, [file]);

  const handleFileUpload = (file) => {
    const storage = getStorage(app);
    const fileName = new Date().getTime() + file.name;
    const storageRef = ref(storage, `avatars/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setFilePerc(Math.round(progress));
      },
      (error) => {
        setFileUploadError(true);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) =>
          setFormData({ ...formData, avatar: downloadURL })
        );
      }
    );
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => {
      const newFormData = { ...prev, [id]: value };
      
      // Calculate BMI if both height and weight are present
      if ((id === 'height' || id === 'weight') && newFormData.height && newFormData.weight) {
        const heightInMeters = Number(newFormData.height) / 100;
        const weightInKg = Number(newFormData.weight);
        if (heightInMeters > 0 && weightInKg > 0) {
          newFormData.bmi = +(weightInKg / (heightInMeters * heightInMeters)).toFixed(2);
        }
      }
      
      return newFormData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      dispatch(updateUserstart());

      // Ensure height and weight are numbers
      const updatedFormData = {
        ...formData,
        height: Number(formData.height),
        weight: Number(formData.weight),
      };

      const res = await fetch(`${API_BASE_URL}/api/user/update/${currentUser._id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFormData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      dispatch(updateUserSuccess(data));
      setUpdateSuccess(true);
      Swal.fire({
        position: "top-end",
        icon: "success",
        title: "Profile updated successfully",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Update error:", error);
      dispatch(updateUserFailure(error.message));
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Server connection error. Please try again later.",
      });
    }
  };

  const handleDeleteUser = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d4a373",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          dispatch(deleteUserstart());
          const res = await fetch(`${API_BASE_URL}/api/user/delete/${currentUser._id}`, {
            method: "DELETE",
            credentials: "include"
          });
          const data = await res.json();
          if (data.success === false) {
            dispatch(deleteUserFailure(data.message));
            return;
          }
          dispatch(deleteUserSuccess(data));
          Swal.fire({
            title: "Deleted!",
            text: "Your account has been deleted.",
            icon: "success",
          });
        } catch (error) {
          dispatch(deleteUserFailure("Connection error"));
          Swal.fire({
            icon: "error",
            title: "Delete Failed",
            text: "Server connection error. Please try again later."
          });
        }
      }
    });
  };

  const getBmiCategory = (bmi) => {
    if (bmi === 0) return "Not calculated";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal weight";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const getBmiColor = (bmi) => {
    if (bmi === 0) return "text-gray-600";
    if (bmi < 18.5) return "text-blue-600";
    if (bmi < 25) return "text-green-600";
    if (bmi < 30) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-grow flex items-center justify-center p-6"
        style={{ backgroundColor: "" }}
      >
        <div className="bg-SecondaryColor p-6 rounded-xl mt-20 shadow-xl max-w-lg w-full">
          <h1
            className="text-3xl font-bold text-center mb-6"
            style={{ color: "#a98467" }}
          >
            Profile
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center">
              <input
                onChange={(e) => setFile(e.target.files[0])}
                type="file"
                ref={fileRef}
                hidden
                accept="image/*"
              />
              <motion.img
                src={formData.avatar || currentUser.avatar}
                alt="profile"
                className="rounded-full h-24 w-24 object-cover cursor-pointer mb-2"
                onClick={() => fileRef.current.click()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              />
              <p className="text-sm">
                {fileUploadError ? (
                  <span className="text-red-600">Error uploading image</span>
                ) : filePerc > 0 && filePerc < 100 ? (
                  <span className="text-gray-600">{`Uploading ${filePerc}%`}</span>
                ) : filePerc === 100 ? (
                  <span className="text-green-600">Upload complete!</span>
                ) : null}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                id="height"
                placeholder="Height (cm)"
                className="border p-3 rounded-lg w-full"
                value={formData.height || ''}
                onChange={handleChange}
              />
              <input
                type="number"
                id="weight"
                placeholder="Weight (kg)"
                className="border p-3 rounded-lg w-full"
                value={formData.weight || ''}
                onChange={handleChange}
              />
            </div>

            {/* Updated BMI Display */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">BMI Information</h3>
              <p className="text-gray-700">
                Your BMI:{" "}
                {currentUser.bmi > 0
                  ? currentUser.bmi.toFixed(2)
                  : "Not calculated"}
              </p>
              <p className={`text-sm mt-1 ${getBmiColor(currentUser.bmi)}`}>
                Category: {getBmiCategory(currentUser.bmi)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                BMI Categories:
                <br />
                Underweight: &lt;18.5 | Normal: 18.5-24.9 | Overweight: 25-29.9
                | Obese: ≥30
              </p>
            </div>

            <input
              type="text"
              id="username"
              placeholder="Username"
              className="border p-3 rounded-lg w-full"
              defaultValue={currentUser.username}
              onChange={handleChange}
            />

            <input
              type="email"
              id="email"
              placeholder="Email"
              className="border p-3 rounded-lg w-full"
              defaultValue={currentUser.email}
              onChange={handleChange}
              readOnly={true}
            />

            <button
              type="submit"
              className="w-full bg-[#d4a373] text-white p-3 rounded-lg flex items-center justify-center hover:bg-[#a98467] transition duration-300"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaUserEdit className="mr-2" />
              )}
              {loading ? "Updating..." : "Update Profile"}
            </button>

            <motion.div
              onClick={handleDeleteUser}
              className="cursor-pointer w-full bg-red-600 text-white p-3 rounded-lg text-center hover:bg-red-700 transition duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaTrash className="mr-2 inline" /> Delete Account
            </motion.div>

            {updateSuccess && (
              <p className="text-center text-green-600">
                <FaCheckCircle className="inline mr-1" /> Profile updated
                successfully!
              </p>
            )}

            {error && (
              <p className="text-center text-red-600">
                <FaCheckCircle className="inline mr-1" /> {error}
              </p>
            )}
          </form>

          {/* Add Image Prediction Section */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Food Image Analysis</h3>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePredictionImageUpload}
                  ref={predictionInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => predictionInputRef.current?.click()}
                  className="bg-[#d4a373] text-white px-4 py-2 rounded-lg hover:bg-[#a98467] transition duration-300"
                >
                  Choose Image
                </button>
                {predictionImage && (
                  <button
                    onClick={handlePredict}
                    disabled={isPredicting}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400"
                  >
                    {isPredicting ? "Analyzing..." : "Analyze Food"}
                  </button>
                )}
              </div>

              {predictionImage && (
                <div className="mt-4 space-y-4">
                  <img
                    src={predictionImage}
                    alt="Selected food"
                    className="w-full max-h-48 object-contain rounded-lg"
                  />
                  {predictionResult && (
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="font-semibold">Predicted Food:</p>
                        <p className="text-gray-700">{predictionResult}</p>
                      </div>

                      {nutritionData && (
                        <div className="bg-white p-4 rounded-lg shadow-md">
                          <h4 className="font-semibold text-lg mb-3">
                            Nutrition Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-50 p-3 rounded">
                              <p className="text-sm font-medium">Calories</p>
                              <p className="text-lg">
                                {nutritionData.nf_calories?.toFixed(1)} kcal
                              </p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="text-sm font-medium">Protein</p>
                              <p className="text-lg">
                                {nutritionData.nf_protein?.toFixed(1)}g
                              </p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded">
                              <p className="text-sm font-medium">Carbs</p>
                              <p className="text-lg">
                                {nutritionData.nf_total_carbohydrate?.toFixed(
                                  1
                                )}
                                g
                              </p>
                            </div>
                            <div className="bg-red-50 p-3 rounded">
                              <p className="text-sm font-medium">Fat</p>
                              <p className="text-lg">
                                {nutritionData.nf_total_fat?.toFixed(1)}g
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 text-sm text-gray-600">
                            <p>
                              Serving size: {nutritionData.serving_weight_grams}
                              g
                            </p>
                            {nutritionData.nf_sugars && (
                              <p>
                                Sugars: {nutritionData.nf_sugars.toFixed(1)}g
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
