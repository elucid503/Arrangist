import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { UseAuth } from '../Utils/AuthContext';

const LoginPage: React.FC = () => {

  const [Email, SetEmail] = useState('');
  const [Password, SetPassword] = useState('');
  const [Error, SetError] = useState('');
  const [IsLoading, SetIsLoading] = useState(false);

  const { Login } = UseAuth();
  const Navigate = useNavigate();

  const HandleSubmit = async (E: React.FormEvent) => {

    E.preventDefault();

    SetError('');
    SetIsLoading(true);

    try {

      await Login(Email, Password);
      Navigate('/dashboard', { replace: true });

    } catch (Err: any) {

      SetError(Err.response?.data?.error || 'Login failed. Please try again.');

    } finally {

      SetIsLoading(false);

    }

  };

  return (

    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">

      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900 dark:text-white">

          Arrangist

        </h1>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">

          Arrange your Life

        </p>

        {Error && (<div className="border border-red-400 text-red-700 px-4 py-3 rounded mb-4">

          {Error}

        </div>)}

        <form onSubmit={HandleSubmit} className="space-y-6">

          <div>

            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={Email} onChange={(E) => SetEmail(E.target.value)} className="input-field" required placeholder="Enter your email" />
          
          </div>

          <div>

            <label className="block text-sm font-medium mb-2">Password</label>
            <input type="password" value={Password} onChange={(E) => SetPassword(E.target.value)} className="input-field" required placeholder="Enter your password" />
          
          </div>

          <button type="submit" disabled={IsLoading} className="w-full btn-primary">

            {IsLoading ? 'Logging in...' : 'Login'}

          </button>

        </form>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">

          Don't have an account? {' '}

          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            
            Register

          </Link>

        </p>

      </div>

    </div>);
  
};

export default LoginPage;