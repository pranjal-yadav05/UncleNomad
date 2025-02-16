import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Property from './models/Property.js';
import Tour from './models/Tour.js';
import Guide from './models/Guide.js';
import connectDB from './db.js';

// Load environment variables from .env file
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });


// Verify MONGO_URI is loaded
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  process.exit(1);
}



const seedData = async () => {
  try {
    await connectDB();
    
    // Clear existing data
    await Property.deleteMany();
    await Tour.deleteMany();
    await Guide.deleteMany();

    // Seed Property
    const property = new Property({
      id: 1,
      title: "Uncle Nomad Manali",
      location: "Manali, Himachal Pradesh",
      description: "Experience luxury in the heart of Manali with breathtaking mountain views",
      image: "manali.png",
      rating: "4.8",
      amenities: ["Mountain View", "Breakfast", "WiFi", "Room Service", "Parking"],
      rooms: [
        {
          id: 1,
          type: "Deluxe",
          price: 2500,
          capacity: 2,
          totalRooms: 4,
          amenities: ["Private Bathroom", "TV", "AC", "Electric Kettle", "Complimentary Tea Set"],
          mealIncluded: false,
          mealPrice: 2000,
          extraBedPrice: 500,
          smokingAllowed: false,
          alcoholAllowed: false,
          childrenAllowed: true,
          childrenPolicy: "0 to 6 years free, 6 to 12 years children beds"
        },
        {
          id: 2,
          type: "Super Deluxe",
          price: 3500,
          capacity: 2,
          totalRooms: 3,
          amenities: ["Private Bathroom", "TV", "AC", "Mini Fridge", "Electric Kettle", "Complimentary Tea Set"],
          mealIncluded: false,
          mealPrice: 2000,
          extraBedPrice: 500,
          smokingAllowed: false,
          alcoholAllowed: false,
          childrenAllowed: true,
          childrenPolicy: "0 to 6 years free, 6 to 12 years children beds"
        },
        {
          id: 3,
          type: "Bunk Beds (Shared)",
          price: 1500,
          capacity: 6,
          totalRooms: 1,
          amenities: ["Shared Bathroom", "Common Area", "Charging Points"],
          mealIncluded: false,
          mealPrice: 2000,
          extraBedPrice: 500,
          smokingAllowed: false,
          alcoholAllowed: false,
          childrenAllowed: true,
          childrenPolicy: "0 to 6 years free, 6 to 12 years children beds"
        }
      ],
      totalCapacity: 27,
      checkInTime: "13:00",
      checkOutTime: "10:30",
      smokingPolicy: "Not Allowed",
      alcoholPolicy: "Not Allowed",
      petPolicy: "Not Allowed",
      cancellationPolicy: "Standard cancellation policy applies",
      houseRules: [
        "No smoking in rooms",
        "No pets allowed",
        "Quiet hours from 10 PM to 7 AM",
        "Respect common areas"
      ],
      tourGuideAvailable: true



    });

    await property.save();

    // Seed Tours
    const tours = [
      {
        id: 1,
        title: "Manali Adventure Package",
        description: "5-day adventure including hiking, camping, and local experiences",
        price: "12999",
        duration: "5 Days",
        groupSize: "6-8 people",
        image: "manali_package.jpeg",
        location: "Manali"
      },
      {
        id: 2,
        title: "Kasol Backpacking Trip",
        description: "3-day backpacking experience in the serene Parvati Valley with riverside camping and local cafe hopping",
        price: "8999",
        duration: "3 Days",
        groupSize: "5-7 people",
        image: "kasol_package.jpg",
        location: "Kasol"
      },
      {
        id: 3,
        title: "Rishikesh Adventure Retreat",
        description: "4-day adventure retreat including river rafting, yoga, and camping by the Ganges",
        price: "10999",
        duration: "4 Days",
        groupSize: "6-10 people",
        image: "rishikesh.jpg",
        location: "Rishikesh"
      }
    ];

    await Tour.insertMany(tours);

    // Seed Guides
    const guides = [
      {
        id: 1,
        name: "Rahul Sharma",
        speciality: "Trekking Expert",
        experience: "5+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi"]
      },
      {
        id: 2,
        name: "Priya Singh",
        speciality: "Cultural Guide",
        experience: "4+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "French"]
      },
      {
        id: 3,
        name: "Amit Mehta",
        speciality: "Adventure Sports Instructor",
        experience: "6+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi"]
      },
      {
        id: 4,
        name: "Neha Verma",
        speciality: "Yoga & Wellness Guide",
        experience: "8+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "Sanskrit"]
      },
      {
        id: 5,
        name: "Vikram Thakur",
        speciality: "Wildlife & Nature Expert",
        experience: "7+ years",
        image: "placeholder.png",
        languages: ["English", "Hindi", "Punjabi"]
      }
    ];

    await Guide.insertMany(guides);

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
