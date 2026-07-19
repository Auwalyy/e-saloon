import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiExclamation } from 'react-icons/hi';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { inventoryService } from '../../services/index';
import { formatCurrency } from '../../utils/helpers';
import { TableSkeleton } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Pagination from '../../components/ui/Pagination';

const AdminInventory = () => {
  const [items, setItems] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [txnModal, setTxnModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regTxn, handleSubmit: handleTxn, reset: resetTxn } = useForm();

  const load = () => {
    setLoading(true);
    inventoryService.getAll({ page, limit: 15, search, low_stock: lowStock ? 'true' : undefined })
      .then(({ data }) => { setItems(data.data || []); setPagination(data.pagination || {}); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search, lowStock]);
  useEffect(() => { inventoryService.getAlerts().then(({ data }) => setAlerts(data.data || [])); }, []);

  const openCreate = () => { setEditing(null); reset({}); setModalOpen(true); };
  const openEdit = (item) => { setEditing(item); reset(item); setModalOpen(true); };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => { if (v !== undefined && k !== 'image') fd.append(k, v); });
      if (data.image?.[0]) fd.append('image', data.image[0]);
      if (editing) await inventoryService.update(editing.id, fd);
      else await inventoryService.create(fd);
      toast.success(editing ? 'Item updated!' : 'Item added!');
      setModalOpen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const onTransaction = async (data) => {
    setSaving(true);
    try {
      await inventoryService.addTransaction(txnModal.id, data);
      toast.success('Transaction recorded!');
      setTxnModal(null);
      resetTxn();
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await inventoryService.delete(deleteTarget.id);
      toast.success('Item removed');
      setDeleteTarget(null);
      load();
    } catch { toast.error('Delete failed'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Track products and stock levels</p>
        </div>
        <Button onClick={openCreate}><HiPlus className="w-4 h-4" /> Add Item</Button>
      </div>

      {alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <HiExclamation className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Low Stock Alert</p>
            <p className="text-sm text-red-600 mt-1">{alerts.map(a => `${a.name} (${a.quantity} left)`).join(', ')}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input className="input pl-10" placeholder="Search inventory..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={lowStock} onChange={e => setLowStock(e.target.checked)} className="rounded border-gray-300 text-gold-500" />
            Low stock only
          </label>
        </div>
      </div>

      {loading ? <TableSkeleton rows={8} cols={7} /> : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Item</th><th>Category</th><th>Qty</th><th>Unit</th><th>Cost</th><th>Selling</th><th>Supplier</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No items found</td></tr>
              ) : items.map((item, i) => (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className={item.quantity <= item.reorder_level ? 'bg-red-50' : ''}>
                  <td>
                    <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                    {item.quantity <= item.reorder_level && <span className="badge badge-red text-xs">Low Stock</span>}
                  </td>
                  <td className="text-sm text-gray-600">{item.category || '—'}</td>
                  <td className={`font-semibold text-sm ${item.quantity <= item.reorder_level ? 'text-red-600' : 'text-gray-900'}`}>{item.quantity}</td>
                  <td className="text-sm text-gray-500">{item.unit || '—'}</td>
                  <td className="text-sm text-gray-600">{item.cost_price ? formatCurrency(item.cost_price) : '—'}</td>
                  <td className="text-sm text-gold-600 font-medium">{item.selling_price ? formatCurrency(item.selling_price) : '—'}</td>
                  <td className="text-sm text-gray-500">{item.supplier || '—'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setTxnModal(item)} className="p-1.5 hover:bg-gold-50 rounded-lg text-gold-600 transition-colors text-xs font-medium px-2">+/-</button>
                      <button onClick={() => openEdit(item)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"><HiPencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteTarget(item)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><HiTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="p-4"><Pagination {...pagination} onPageChange={setPage} /></div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Item' : 'Add Item'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><Input label="Item Name" error={errors.name?.message} {...register('name', { required: 'Required' })} /></div>
            <Input label="Category" {...register('category')} />
            <Input label="Unit (e.g. bottle, kg)" {...register('unit')} />
            <Input label="Quantity" type="number" {...register('quantity')} />
            <Input label="Reorder Level" type="number" {...register('reorder_level')} />
            <Input label="Cost Price (₦)" type="number" step="0.01" {...register('cost_price')} />
            <Input label="Selling Price (₦)" type="number" step="0.01" {...register('selling_price')} />
            <Input label="Supplier" {...register('supplier')} />
            <Input label="Supplier Contact" {...register('supplier_contact')} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={2} {...register('description')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Update' : 'Add'} Item</Button>
          </div>
        </form>
      </Modal>

      {/* Transaction Modal */}
      <Modal isOpen={!!txnModal} onClose={() => setTxnModal(null)} title={`Stock Transaction — ${txnModal?.name}`} size="sm">
        <form onSubmit={handleTxn(onTransaction)} className="space-y-4">
          <div>
            <label className="label">Transaction Type</label>
            <select className="input" {...regTxn('type', { required: true })}>
              <option value="purchase">Purchase (Add Stock)</option>
              <option value="sale">Sale (Remove Stock)</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
            </select>
          </div>
          <Input label="Quantity" type="number" {...regTxn('quantity', { required: true, min: 1 })} />
          <Input label="Unit Price (₦)" type="number" step="0.01" {...regTxn('unit_price')} />
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} {...regTxn('notes')} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setTxnModal(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Record Transaction</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Remove Item" message={`Remove "${deleteTarget?.name}" from inventory?`} />
    </div>
  );
};

export default AdminInventory;
