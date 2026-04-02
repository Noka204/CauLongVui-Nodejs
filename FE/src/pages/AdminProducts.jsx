import React, { useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import ProductForm from '../components/ProductForm';
import { getApiOrigin } from '../services/api.client';
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../hooks/useProducts';

const TYPE_FILTERS = ['All', 'Food', 'Drink', 'Equipment'];
const STATUS_FILTERS = ['All', 'Active', 'Inactive'];

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${getApiOrigin()}${path}`;
  return path;
};

const statusClass = (status) => {
  if (status === 'Active') return 'bg-teal-50 text-teal-700';
  return 'bg-slate-100 text-slate-600';
};

export default function AdminProducts() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const queryParams = useMemo(() => ({
    page: 1,
    limit: 300,
    search: searchKeyword.trim() || undefined,
    type: typeFilter === 'All' ? undefined : typeFilter,
    status: statusFilter === 'All' ? undefined : statusFilter,
  }), [searchKeyword, statusFilter, typeFilter]);

  const productsQuery = useProducts(queryParams);

  const createMutation = useCreateProduct({
    onSuccess: () => handleCloseForm(),
  });

  const updateMutation = useUpdateProduct({
    onSuccess: () => handleCloseForm(),
  });

  const deleteMutation = useDeleteProduct();

  const products = useMemo(() => productsQuery.data?.items || [], [productsQuery.data]);

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  function handleCloseForm() {
    setIsFormOpen(false);
    setEditingProduct(null);
  }

  function handleEdit(product) {
    setEditingProduct(product);
    setIsFormOpen(true);
  }

  async function handleSubmit(payload) {
    if (editingProduct) {
      return updateMutation.mutateAsync({ id: normalizeId(editingProduct.id || editingProduct._id), data: payload });
    }
    return createMutation.mutateAsync(payload);
  }

  async function handleDelete(productId) {
    const confirmed = window.confirm('Xac nhan xoa mem san pham nay?');
    if (!confirmed) return;
    return deleteMutation.mutateAsync(productId);
  }

  if (productsQuery.isLoading) {
    return <div className="text-xs font-black uppercase text-slate-400 p-8">Dang tai du lieu san pham...</div>;
  }

  if (productsQuery.error) {
    return (
      <div className="p-8">
        <p className="text-xs font-black uppercase text-red-500">Khong tai duoc du lieu</p>
        <p className="text-sm font-bold text-slate-500 mt-2">{productsQuery.error.message || 'Vui long thu lai sau.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Quan Ly San Pham</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            CRUD MENU DO AN - NUOC UONG
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} disabled={isMutating}>
          Tao San Pham
        </Button>
      </header>

      <section className="bento-card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tim kiem</label>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tim theo ten san pham..."
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loai</label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            >
              {TYPE_FILTERS.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trang thai</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-bold text-xs"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bento-card overflow-hidden !p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">San Pham</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loai</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gia</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ton Kho</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trang Thai</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao Tac</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[10px] font-black text-slate-300 uppercase italic">
                  Khong co san pham phu hop bo loc
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const productId = normalizeId(product.id || product._id);

                return (
                  <tr key={productId} className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={resolveImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{product.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">#{productId.slice(-8)}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-700 uppercase">{product.type}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{formatMoney(product.price)}</p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-900">{product.stockQuantity}</p>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${statusClass(product.status)}`}>
                        {product.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          disabled={isMutating}
                          className="text-[10px] font-black text-slate-500 hover:text-teal-600 uppercase tracking-widest disabled:opacity-40"
                        >
                          Sua
                        </button>

                        <span className="text-slate-200 text-xs">|</span>

                        <button
                          type="button"
                          onClick={() => handleDelete(productId)}
                          disabled={isMutating || product.status === 'Inactive'}
                          className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest disabled:opacity-40"
                        >
                          Xoa
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
        <ProductForm
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          initialData={editingProduct}
        />
      ) : null}
    </div>
  );
}
