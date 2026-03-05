import Cryptr from "cryptr";

export const encrypt = ( input ) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || "this-is-encryption-key-for-chessify";
  const cryptr = new Cryptr(encryptionKey);
  let encryptedString = cryptr.encrypt(input);
  return cryptr.encrypt(encryptedString);
}

export const decrypt = ( input ) => {
  const encryptionKey = process.env.ENCRYPTION_KEY || "this-is-encryption-key-for-chessify";
  const cryptr = new Cryptr(encryptionKey);
  let decryptedString = cryptr.decrypt(input);
  return cryptr.decrypt(decryptedString);
}