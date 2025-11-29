import { Context } from 'hono';

import { UserModel } from '../Models/User';

import { GetUserID } from '../Middleware/Auth';
import { HashPassword, ComparePassword, GenerateToken } from '../Utils/Auth';
import { RegisterSchema, LoginSchema } from '../Utils/Validation';

export class UserController {

  static async Register(c: Context) {

    return await c.req.json().then(async (Body) => {

      const ValidatedData = RegisterSchema.parse(Body);

      // Check if user already exists
      
      const ExistingUser = await UserModel.findOne({ Email: ValidatedData.Email });

      if (ExistingUser) {

        return c.json({ error: 'User already exists with this email' }, 400);

      }

      // Hash password

      const HashedPassword = await HashPassword(ValidatedData.Password);

      // Create user

      const NewUser = await UserModel.create({

        Email: ValidatedData.Email,
        Password: HashedPassword,
        Name: ValidatedData.Name,
        
      });

      // Generate token

      const Token = GenerateToken(NewUser._id.toString());

      return c.json({

        message: 'User registered successfully',
        
        user: { // Simplified user object
            
          Id: NewUser._id,
          Email: NewUser.Email,
          Name: NewUser.Name,
        },

        token: Token,
          
      }, 201); // 201 Created
      
    }).catch((error: any) => {

      if (error.name == 'ZodError') {
          
        return c.json({ error: 'Validation error', details: error.errors }, 400);
      
      }
        
      return c.json({ error: error.message || 'Registration failed' }, 500);

    });
    
  }

  static async Login(c: Context) {

    return await c.req.json().then(async (Body) => {

      const ValidatedData = LoginSchema.parse(Body);

      // Find user

      const User = await UserModel.findOne({ Email: ValidatedData.Email });

      if (!User) {

        return c.json({ error: 'Invalid email or password' }, 401);

      }

      // Verify password

      const IsPasswordValid = await ComparePassword(ValidatedData.Password, User.Password);

      if (!IsPasswordValid) {

        return c.json({ error: 'Invalid email or password' }, 401);

      }

      // Generate token

      const Token = GenerateToken(User._id.toString());

      return c.json({

        message: 'Login successful',

        user: {

          Id: User._id,
          Email: User.Email,
          Name: User.Name,

        },

        token: Token,

      });

    }).catch((error: any) => {

      if (error.name == 'ZodError') {

        return c.json({ error: 'Validation error', details: error.errors }, 400);

      }

      return c.json({ error: error.message || 'Login failed' }, 500);

    });

  }

  static async GetProfile(c: Context) {

    const UserID = GetUserID(c);
    
    return await UserModel.findById(UserID).select('-Password').then((User) => {

      if (!User) {

        return c.json({ error: 'User not found' }, 404);

      }

      return c.json({

        user: {

          Id: User._id,
          Email: User.Email,
          Name: User.Name,
          CreatedAt: User.CreatedAt,

        },
        
      });
      
    }).catch((error: any) => {

      return c.json({ error: error.message || 'Failed to fetch profile' }, 500);

    });
    
  }

}