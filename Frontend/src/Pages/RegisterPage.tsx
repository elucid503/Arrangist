import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UseAuth } from '../Utils/AuthContext';

const RegisterPage: React.FC = () => {
  const [Name, SetName] = useState('');
  const [Email, SetEmail] = useState('');
  const [Password, SetPassword] = useState('');
  const [ConfirmPassword, SetConfirmPassword] = useState('');
  const [Error, SetError] = useState('');
  const [IsLoading, SetIsLoading] = useState(false);
  const { Register } = UseAuth();
  const Navigate = useNavigate();

  const HandleSubmit = async (E: React.FormEvent) => {
    E.preventDefault();
    SetError('');

    if (Password !== ConfirmPassword) {
      SetError('Passwords do not match');
      return;
    }

    if (Password.length < 6) {
      SetError('Password must be at least 6 characters long');
      return;
    }

    SetIsLoading(true);

    try {
      await Register(Name, Email, Password);
      Navigate('/dashboard', { replace: true });
    } catch (Err: any) {
      SetError(Err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      SetIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          SmartAssign
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
          Create your account
        </p>

        {Error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {Error}
          </div>
        )}

        <form onSubmit={HandleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={Name}
              onChange={(E) => SetName(E.target.value)}
              className="input-field"
              required
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={Email}
              onChange={(E) => SetEmail(E.target.value)}
              className="input-field"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={Password}
              onChange={(E) => SetPassword(E.target.value)}
              className="input-field"
              required
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              value={ConfirmPassword}
              onChange={(E) => SetConfirmPassword(E.target.value)}
              className="input-field"
              required
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={IsLoading}
            className="w-full btn-primary"
          >
            {IsLoading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
