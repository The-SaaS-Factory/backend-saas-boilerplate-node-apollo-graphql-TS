import bcrypt from "bcryptjs";

export const users = [
  {
    username: "admin",
    name: "admin",
    email: "admin@admin.com",
    password: await bcrypt.hashSync("123456789", 10),
  },
  {
    username: "user",
    name: "user",
    email: "user@user.com",
    password: await bcrypt.hashSync("123456789", 10),
  },
];
