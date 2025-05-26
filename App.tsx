
import React from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { DataProvider } from './hooks/useData';
import DashboardPage from './pages/DashboardPage';
import PlannerPage from './pages/PlannerPage';
import RecipeLibraryPage from './pages/RecipeLibraryPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import DataManagementPage from './pages/DataManagementPage';
import ShoppingListPage from './pages/ShoppingListPage';
import { IconHome, IconCalendar, IconBook, IconPlusCircle, IconShoppingCart, IconUpload } from './components/Icon';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: <IconHome /> },
  { path: '/planner', label: 'Planejador', icon: <IconCalendar /> },
  { path: '/recipes', label: 'Receitas', icon: <IconBook /> },
  { path: '/manage-data', label: 'Gerenciar Dados', icon: <IconPlusCircle /> },
  { path: '/shopping-list', label: 'Lista de Compras', icon: <IconShoppingCart /> },
];

const App: React.FC = () => {
  return (
    <DataProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/planner" element={<PlannerPage />} />
              <Route path="/recipes" element={<RecipeLibraryPage />} />
              <Route path="/recipe/:id" element={<RecipeDetailPage />} />
              <Route path="/manage-data" element={<DataManagementPage />} />
              <Route path="/shopping-list" element={<ShoppingListPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </HashRouter>
    </DataProvider>
  );
};

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-3xl font-bold text-emerald-600 flex items-center">
            <span role="img" aria-label="Salad icon" className="mr-2 text-4xl">🥗</span>
            NutriPlanner
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-2">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.path} to={item.path} currentPath={location.pathname} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-emerald-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md pb-4">
          {NAV_ITEMS.map((item) => (
            <MobileNavLink key={item.path} to={item.path} currentPath={location.pathname} icon={item.icon} onClick={() => setIsMobileMenuOpen(false)}>
              {item.label}
            </MobileNavLink>
          ))}
        </div>
      )}
    </nav>
  );
};

interface NavLinkProps {
  to: string;
  currentPath: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, currentPath, children, icon, onClick }) => {
  const isActive = currentPath === to;
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out
        ${isActive ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </Link>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ to, currentPath, children, icon, onClick }) => {
    const isActive = currentPath === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`block px-4 py-3 text-sm font-medium transition-colors duration-150 ease-in-out
          ${isActive ? 'bg-emerald-500 text-white' : 'text-gray-700 hover:bg-emerald-100 hover:text-emerald-700'}`}
      >
        <div className="flex items-center">
          {icon && <span className="mr-3">{icon}</span>}
          {children}
        </div>
      </Link>
    );
  };


const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-6 mt-auto">
      <p>&copy; {new Date().getFullYear()} NutriPlanner. Todos os direitos reservados.</p>
      <p className="text-sm text-gray-400 mt-1">Planeje sua dieta, viva melhor!</p>
    </footer>
  );
};

export default App;
