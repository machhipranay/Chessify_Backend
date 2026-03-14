import bcrypt from "bcrypt";

const hashPassword = async (password) => bcrypt.hash(password, 10);

const comparePassword = async (password, hash) => bcrypt.compare(password, hash);

export { hashPassword, comparePassword };