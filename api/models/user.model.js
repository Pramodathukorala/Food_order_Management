import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    ismanager: {
      type: Boolean,
      default: false,
      required: true,
    },
    usertype: {
      type: String,
      required: true,
      default: "customer",
    },
    avatar: {
      type: String,
      default:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5dgckCEFdaR4QrzY1cdQTF_VzmwmPkSV2UA&usqp=CAU",
    },
    height: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 0,
    },
    bmi: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Update the pre-save middleware to properly handle empty values
userSchema.pre('save', function(next) {
  if (this.height && this.weight && this.height > 0 && this.weight > 0) {
    const heightInMeters = this.height / 100;
    this.bmi = +(this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  } else {
    this.bmi = 0;
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
