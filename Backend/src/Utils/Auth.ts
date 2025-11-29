import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JwtSecret = process.env.JWT_SECRET || 'default-secret-key';
const JwtExpiresIn = process.env.JWT_EXPIRES_IN || '30d';

export const HashPassword = async (Password: string): Promise<string> => {

  const Salt = await bcrypt.genSalt(10);
  return bcrypt.hash(Password, Salt);

};

export const ComparePassword = async (Password: string, HashedPassword: string): Promise<boolean> => {

  return bcrypt.compare(Password, HashedPassword);

};

export const GenerateToken = (UserID: string): string => {

  return jwt.sign({ UserId: UserID }, JwtSecret, { expiresIn: JwtExpiresIn as any });

};

export const VerifyToken = async (Token: string): Promise<{ UserId: string }> => {

  return new Promise((resolve, reject) => {

    jwt.verify(Token, JwtSecret, (err, decoded) => {

      if (err) {

        reject(new Error('Invalid or expired token'));

      } else {

        const Payload = decoded as { UserId: string };
        resolve({ UserId: Payload.UserId });

      }
    });

  });

};