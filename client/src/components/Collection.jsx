import React from "react";
import img from "../assets/img/collection1.png";

export default function Collection() {
  return (
    <div className="h-screen lg:h-[70vh] flex flex-col justify-center lg:flex-row items-center bg-PrimaryColor mt-14 lg:px-32 px-5">
      {/* img section */}
      <div className=" flex justify-center w-full lg:w-2/4 pt-6">
        <img src={img} alt="img" />
      </div>

      {/* content section */}
      <div className=" w-full lg:w-2/4 space-y-4 pt-5 text-center lg:text-start">
        <h1 className=" text-4xl font-semibold text-ExtraDarkColor">
          Best Summer Feast! 
        </h1>
        <h3 className=" text-lg font-medium text-DarkColor">
          Enjoy Up to 60% Off on Your Favorite Dishes!
        </h3>
        <p>
          Savor the taste of summer with delicious deals! 
          Enjoy up to 60% off on your favorite meals. 
          Order now and indulge in the flavors of the season!
        </p>

        <button className=" bg-ExtraDarkColor text-white px-4 py-2 font-medium active:bg-amber-800">
          Order Now
        </button>
      </div>
    </div>
  );
}
