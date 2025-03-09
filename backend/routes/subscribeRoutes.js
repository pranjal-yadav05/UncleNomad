import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true }
});

// Create model
const Subscriber = mongoose.model('Subscriber', subscriberSchema);

router.post('/',async (req,res)=>{
    try{
        const {email} = req.body;
        await Subscriber.insertOne({ email });
        res.status(201).json({ message: "Subscribed successfully!" });
    }catch(error){
        console.error(error);
        res.status(500).json({ message: "Something went wrong" });
    }
})

export default router