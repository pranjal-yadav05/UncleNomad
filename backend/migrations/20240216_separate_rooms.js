import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Property from '../models/Property.js';




async function migrateRooms() {
  try {
    // Connect to database
    const { mongoUri } = await import('../db.js');
    await mongoose.connect(mongoUri);






    // Get all properties
    const properties = await Property.find({});

    // Migrate rooms from properties to separate collection
    for (const property of properties) {
      for (const room of property.rooms) {
        // Create new room document
        const newRoom = new Room({
          id: room.id,
          type: room.type,
          price: room.price,
          capacity: room.capacity,
          totalRooms: room.totalRooms,
          amenities: room.amenities,
          mealIncluded: room.mealIncluded,
          mealPrice: room.mealPrice,
          extraBedPrice: room.extraBedPrice,
          smokingAllowed: room.smokingAllowed,
          alcoholAllowed: room.alcoholAllowed,
          childrenAllowed: room.childrenAllowed,
          childrenPolicy: room.childrenPolicy,
          beds: room.beds
        });

        // Save new room
        await newRoom.save();
      }
    }

    console.log('Room migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();




  }
}

migrateRooms();
