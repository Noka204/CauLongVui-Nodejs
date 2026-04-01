import React, { useMemo, useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { useRoles } from '../hooks/useRoles';
import { Button } from '../components/ui/Button';
import UserForm from '../components/UserForm';

const LIST_PARAMS = { page: 1, limit: 200 };

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const statusBadgeClass = (status) => {
  if (status === 'active') return 'bg-teal-50 text-teal-600';
  if (status === 'deleted') return 'bg-red-50 text-red-600';
  return 'bg-slate-100 text-slate-500';
};

const statusLabel = (status) => {
  if (status === 'active') return 'DANG HOAT DONG';
  if (status === 'deleted') return 'DA XOA';
  return 'KHONG XAC DINH';
};

export default function Users() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const usersQuery = useUsers(LIST_PARAMS);
  const rolesQuery = useRoles();

  const createMutation = useCreateUser({
    onSuccess: () => handleCloseForm(),
  });

  const updateMutation = useUpdateUser({
    onSuccess: () => handleCloseForm(),
  });

  const deleteMutation = useDeleteUser();

  const users = useMemo(() => usersQuery.data?.items || [], [usersQuery.data]);
  const roles = useMemo(() => rolesQuery.data?.items || [], [rolesQuery.data]);

  const roleMap = useMemo(() => {
    return new Map(roles.map((role) => [normalizeId(role), role.roleName]));
  }, [roles]);

  const isLoading = usersQuery.isLoading || rolesQuery.isLoading;
  const isError = usersQuery.isError || rolesQuery.isError;

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUser(null);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSubmit = async (formData) => {
    const payload = { ...formData };

    if (!payload.password) {
      delete payload.password;
    }

    if (editingUser) {
      return updateMutation.mutateAsync({ id: editingUser.id, data: payload });
    }

    return createMutation.mutateAsync(payload);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm('XAC NHAN XOA USER NAY?');
    if (!confirmed) return;
    deleteMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="text-xs font-black uppercase text-slate-400 p-8">DANG TAI DU LIEU...</div>;
  }

  if (isError) {
    return <div className="text-xs font-black uppercase text-red-500 p-8">LOI TAI DU LIEU</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Quan Ly Nguoi Dung</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">DANH SACH THANH VIEN VA QUYEN</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} aria-label="Them nguoi dung">
          THEM MOI
        </Button>
      </header>

      <section className="bento-card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thong Tin</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quyen</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tinh Trang</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao Tac</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Chua co nguoi dung nao
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const roleName = roleMap.get(normalizeId(user.roleId)) || normalizeId(user.roleId) || 'N/A';
                const status = user.status || 'active';

                return (
                  <tr key={user.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{user.fullName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">{user.phoneNumber || '--'}</p>
                      <p className="text-[10px] font-bold text-slate-400">{user.email || '--'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700 uppercase">{roleName}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusBadgeClass(status)}`}
                      >
                        {statusLabel(status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(user)}
                          className="text-[10px] font-black text-slate-400 hover:text-teal-600 uppercase tracking-widest"
                        >
                          SUA
                        </button>
                        <span className="text-slate-200 text-xs">|</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(user.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest disabled:opacity-40"
                        >
                          XOA
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {isFormOpen ? (
        <UserForm onSubmit={handleSubmit} initialData={editingUser} onCancel={handleCloseForm} />
      ) : null}
    </div>
  );
}
