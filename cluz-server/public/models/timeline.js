import mongoose from "mongoose";
const schema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["video", "album", "bible-commentary"],
    },
    content: String,
    likes_count: Number,
    comments_count: Number,
    shared_count: Number,
}, { collection: 'timeline' });
export default mongoose.model("Timeline", schema);
