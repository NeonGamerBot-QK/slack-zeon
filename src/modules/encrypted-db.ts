// enc json db??
import crypto from "crypto";
import JSONdb from "simple-json-db";

export class EncryptedJsonDb extends JSONdb {
  password: string;
  constructor(storepath, ops) {
    let password = ops.password;
    ops = {
      ...ops,
      stringify(o) {
        return Buffer.from(
          EncryptedJsonDb.encrypt(JSON.stringify(o), password),
        ).toString(`base64`);
      },
      parse(s) {
        return JSON.parse(
          EncryptedJsonDb.decrypt(
            Buffer.from(s.toString(), "base64").toString(`ascii`),
            password,
          ),
        );
      },
    };
    super(storepath, ops);
    this.password = password;
  }

  // Encryption function
  static encrypt(text: string, password: string) {
    // Generate a random Initialization Vector (IV)
    const iv = crypto.randomBytes(16);

    // Derive a 32-byte key from the password
    const key = crypto.scryptSync(password, "salt", 32);

    // Create a cipher instance
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return the IV and encrypted text in a single package
    return `${iv.toString("hex")}:${encrypted}`;
  }

  // Decryption function
  static decrypt(encryptedText: string, password: string) {
    // Split the encrypted text into IV and ciphertext
    const [ivHex, encrypted] = encryptedText.split(":");

    // Convert the IV back to a Buffer
    const iv = Buffer.from(ivHex, "hex");

    // Derive the key from the password
    const key = crypto.scryptSync(password, "salt", 32);

    // Create a decipher instance
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
