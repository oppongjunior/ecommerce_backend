import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashingService {
  /**
   * Generates a hashed string from the provided data using bcrypt.
   *
   * @param data - The data to be hashed, which can be a string or a Buffer.
   * @returns A promise that resolves to the hashed string.
   */
  abstract hash(data: string | Buffer): Promise<string>;

  /**
   * Compares a given data string or buffer with an encrypted string to determine if they match.
   *
   * @param data - The plain data to compare, which can be a string or a Buffer.
   * @param encrypted - The encrypted string to compare against.
   * @returns A promise that resolves to a boolean indicating whether the data matches the encrypted string.
   */
  abstract compare(data: string | Buffer, encrypted: string): Promise<boolean>;
}
