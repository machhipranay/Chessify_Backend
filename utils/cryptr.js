import Cryptr from "cryptr";

export const encrypt = ( input ) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || "this-is-encryption-key-for-chessify";
  const cryptr = new Cryptr(encryptionKey);
  let toBase64 = Buffer.from(input).toString("base64");
  return cryptr.encrypt(cryptr.encrypt(toBase64));
}

export const decrypt = ( input ) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || "this-is-encryption-key-for-chessify";
  const cryptr = new Cryptr(encryptionKey);
  let decryptedString = cryptr.decrypt(cryptr.decrypt(input));
  return Buffer.from(decryptedString, "base64").toString("ascii");
}