import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CrmProvider } from './context/CrmContext';
import { AppRoutes } from './routes/AppRoutes';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CrmProvider>
          <AppRoutes />
        </CrmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
