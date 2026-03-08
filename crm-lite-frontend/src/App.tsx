// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Pipeline from "./pages/Pipeline/Pipeline";
import Communications from "./pages/Communications/Communications";
import Analytics from "./pages/Analytics/Analytics";
import CustomerDetail from "./pages/CustomerDetail/CustomerDetail";
import Reminders from "./pages/Reminders/Reminders";

import { Toaster } from 'react-hot-toast';

import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/Login/Login";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/:id" element={<CustomerDetail />} />
                  <Route path="/communications" element={<Communications />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reminders" element={<Reminders />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
