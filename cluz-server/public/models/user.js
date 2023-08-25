import mongoose from "mongoose";
const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
    },
    //Set avatar by default
    avatar: {
        type: String,
        default: "/assets/img/avatar.png",
    },
    password: {
        type: String,
        required: true,
        minlength: 3,
    },
    phone: String,
    email: String,
    followers: [
        {
            ref: "User",
            type: mongoose.Schema.Types.ObjectId,
        }
    ]
});
export default mongoose.model("User", schema);
export const generateUserModel = ({ user }) => ({
    getAll: () => {
        if (!user || !user.roles.includes('admin'))
            return null;
        return 'http://myurl.com/users';
    },
    getById: (id) => {
        /* fetching/transform logic for a single user */
    },
    getByGroupId: (id) => {
        /* fetching/transform logic for a group of users */
    },
});
