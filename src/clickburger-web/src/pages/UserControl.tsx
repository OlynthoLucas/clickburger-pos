import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface UserData {
  id: string;
  username: string;
  email: string;
  role: string;
}

export const UserControl = () => {
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users'); // Ajuste o endpoint se necessário
      setUsers(response.data);
      setError('');
    } catch (err) {
      setError('Erro ao carregar a lista de usuários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await api.delete(`/api/users/${id}`);
        setUsers(users.filter(u => u.id !== id));
      } catch (err) {
        alert('Erro ao excluir usuário');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 border-l-4 border-red-600 pl-4">
            Controle de Usuários
          </h1>
          <button 
            onClick={fetchUsers}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-md"
          >
            Atualizar Lista
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-10 text-center">
              <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 font-medium">Carregando usuários...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <th className="p-4 font-semibold">Nome</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Cargo</th>
                    <th className="p-4 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-red-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-800">{user.username}</td>
                        <td className="p-4 text-gray-600">{user.email}</td>
                        <td className="p-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold capitalize
                            ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                              user.role === 'garcom' ? 'bg-blue-100 text-blue-700' : 
                              'bg-green-100 text-green-700'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {!(user.role === 'superadmin' && currentUser?.role !== 'superadmin') && (
                            <button 
                              onClick={() => handleDelete(user.id)}
                              className="text-red-500 hover:text-red-700 font-medium text-sm px-3 py-1 bg-red-50 hover:bg-red-100 rounded transition-colors"
                            >
                              Excluir
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
