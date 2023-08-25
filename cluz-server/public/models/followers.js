import mongoose from "mongoose";
const schema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    follower_id: {
        type: String,
        required: true,
    },
});
export default mongoose.model("Follower", schema);
