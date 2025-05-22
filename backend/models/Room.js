import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    totalRooms: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    amenities: [String],
    mealIncluded: Boolean,
    mealPrice: Number,
    extraBedPrice: Number,
    smokingAllowed: Boolean,
    alcoholAllowed: Boolean,
    childrenAllowed: Boolean,
    childrenPolicy: String,
    beds: [
      {
        number: Number,
        isOccupied: Boolean,
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Virtual for reviews
roomSchema.virtual("reviews", {
  ref: "UserReview",
  localField: "_id",
  foreignField: "itemId",
  match: { bookingType: "room" },
});

// Method to get available bunk beds
roomSchema.methods.getAvailableBunkBeds = function () {
  return this.beds.filter((bed) => !bed.isOccupied);
};

const Room = mongoose.model("Room", roomSchema);
export default Room;
