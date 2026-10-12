import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HiOutlineArchive, HiOutlineCube, HiOutlineCurrencyDollar, HiOutlineExclamation, HiOutlinePencil, HiOutlinePlus,
  HiOutlineSwitchVertical, HiOutlineTrash, HiOutlineTruck,
} from 'react-icons/hi';
import useFetch from '../../hooks/useFetch';
import useDebounce from '../../hooks/useDebounce';
import { inventoryService } from '../../services';
import { getErrorMessage } from '../../services/api';
import { cleanParams, formatCurrency, formatDateTime, humanize } from '../../utils/helpers';
import { applyServerErrors, rules } from '../../utils/validation';
import PageHeader from '../../components/admin/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import { TableSkeleton } from '../../components/ui/Skeleton';

const TABS = [
  { value: 'products', label: 'Products' },
  { value: 'purchase', label: 'Purchases' },
  { value: 'sale', label: 'Sales' },
  { value: 'suppliers', label: 'Suppliers' },
];
const TYPE_BADGES = { purchase: 'badge-blue', sale: 'badge-green', adjustment: 'badge-gray' };

/* ------------------------------- Product form ------------------------------- */

const ProductForm = ({ item, isOpen, onClose, onSaved, suppliers }) => {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (!isOpen) return;
    reset({
      name: item?.name || '', sku: item?.sku || '', category: item?.category || 'General', supplier: item?.supplier?.id || '',
      unit: item?.unit || 'pcs', quantity: 0, reorderLevel: item?.reorderLevel ?? 5, costPrice: item?.costPrice ?? 0, sellingPrice: item?.sellingPrice ?? 0,
    });
  }, [isOpen, item, reset]);

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      reorderLevel: Number(values.reorderLevel), costPrice: Number(values.costPrice), sellingPrice: Number(values.sellingPrice),
      quantity: Number(values.quantity) || 0,
    };
    try {
      const { message } = item ? await inventoryService.update(item.id, payload) : await inventoryService.create(payload);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to save the product'));
    }
  };

  const nonNegative = { min: { value: 0, message: 'Cannot be negative' } };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item ? 'Edit product' : 'Add product'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Product name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="SKU / code" placeholder="e.g. HAIR-SH-001" error={errors.sku?.message} {...register('sku', { required: 'SKU is required' })} />
          <Input label="Category" error={errors.category?.message} {...register('category')} />
          <div>
            <label className="label" htmlFor="product-supplier">Supplier</label>
            <select id="product-supplier" className="input" {...register('supplier')}>
              <option value="">No supplier</option>
              {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
            </select>
          </div>
          <Input label="Unit" placeholder="pcs, bottles, packs..." error={errors.unit?.message} {...register('unit')} />
          <Input label="Reorder level" type="number" min={0} error={errors.reorderLevel?.message} {...register('reorderLevel', nonNegative)} />
          <Input label="Cost price (₦)" type="number" min={0} step="50" error={errors.costPrice?.message} {...register('costPrice', nonNegative)} />
          <Input label="Selling price (₦)" type="number" min={0} step="50" error={errors.sellingPrice?.message} {...register('sellingPrice', nonNegative)} />
          {!item && <Input label="Opening stock" type="number" min={0} error={errors.quantity?.message} {...register('quantity', nonNegative)} />}
        </div>
        {item && <p className="text-xs text-gray-500">Stock levels change through purchases, sales and adjustments, so every movement is recorded.</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>{item ? 'Save Changes' : 'Add Product'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------ Stock movement ------------------------------ */

const StockModal = ({ item, onClose, onSaved, suppliers }) => {
  const [type, setType] = useState('purchase');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!item) return;
    setType('purchase');
    setQuantity('');
    setUnitPrice(String(item.costPrice));
    setSupplier(item.supplier?.id || '');
    setNote('');
  }, [item]);

  const changeType = (value) => {
    setType(value);
    setUnitPrice(String(value === 'sale' ? item.sellingPrice : item.costPrice));
  };

  const amount = Number(quantity);
  const delta = type === 'sale' ? -Math.abs(amount) : type === 'purchase' ? Math.abs(amount) : amount;
  const resulting = item ? item.quantity + (delta || 0) : 0;
  const valid = Number.isInteger(amount) && amount !== 0 && (type === 'adjustment' || amount > 0) && resulting >= 0;

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await inventoryService.addTransaction(item.id, cleanParams({ type, quantity: amount, unitPrice: type === 'adjustment' ? '' : unitPrice, supplier: type === 'purchase' ? supplier : '', note }));
      toast.success('Stock updated');
      onSaved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to update stock'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} title="Update stock">
      {item && (
        <form onSubmit={save} className="space-y-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{item.name}</span> currently has{' '}
            <span className="font-semibold text-gray-900">{item.quantity} {item.unit}</span> in stock.
          </p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Movement type">
            {[['purchase', 'Purchase (stock in)'], ['sale', 'Sale (stock out)'], ['adjustment', 'Adjustment']].map(([value, label]) => (
              <button key={value} type="button" role="radio" aria-checked={type === value} onClick={() => changeType(value)} className={`px-2 py-2.5 rounded-xl text-xs font-medium border-2 transition-colors ${type === value ? 'border-gold-500 bg-gold-50 text-gold-800' : 'border-gray-100 text-gray-600'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label={type === 'adjustment' ? 'Change (+ or -)' : 'Quantity'} type="number" step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder={type === 'adjustment' ? 'e.g. -2' : 'e.g. 10'} required />
            {type !== 'adjustment' && (
              <Input label={`Unit ${type === 'sale' ? 'selling' : 'cost'} price (₦)`} type="number" min={0} value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
            )}
          </div>
          {type === 'purchase' && (
            <div>
              <label className="label" htmlFor="stock-supplier">Supplier</label>
              <select id="stock-supplier" className="input" value={supplier} onChange={(event) => setSupplier(event.target.value)}>
                <option value="">No supplier</option>
                {suppliers.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>
          )}
          <Input label="Note (optional)" maxLength={300} value={note} onChange={(event) => setNote(event.target.value)} placeholder={type === 'adjustment' ? 'e.g. damaged, stock count correction' : ''} />

          <div className={`rounded-xl px-4 py-3 text-sm flex justify-between ${resulting < 0 ? 'bg-red-50 text-red-700' : 'bg-salon-bg text-gray-700'}`}>
            <span>{resulting < 0 ? 'Not enough stock for this movement' : 'Stock after this movement'}</span>
            <span className="font-semibold">{resulting} {item.unit}</span>
          </div>
          {type !== 'adjustment' && amount > 0 && (
            <p className="text-sm text-gray-600 text-right">Total: <span className="font-semibold text-gray-900">{formatCurrency(amount * Number(unitPrice || 0))}</span></p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving} disabled={!valid}>Save Movement</Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

/* -------------------------------- Suppliers --------------------------------- */

const SupplierForm = ({ supplier, isOpen, onClose, onSaved }) => {
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (isOpen) reset({ name: supplier?.name || '', contactPerson: supplier?.contactPerson || '', phone: supplier?.phone || '', email: supplier?.email || '', address: supplier?.address || '' });
  }, [isOpen, supplier, reset]);

  const onSubmit = async (values) => {
    try {
      const { message } = supplier ? await inventoryService.updateSupplier(supplier.id, values) : await inventoryService.createSupplier(values);
      toast.success(message);
      onSaved();
      onClose();
    } catch (error) {
      if (!applyServerErrors(error, setError)) toast.error(getErrorMessage(error, 'Unable to save the supplier'));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={supplier ? 'Edit supplier' : 'Add supplier'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input label="Supplier name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
        <Input label="Contact person" error={errors.contactPerson?.message} {...register('contactPerson')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone', rules.optionalPhone)} />
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        </div>
        <Input label="Address" error={errors.address?.message} {...register('address')} />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" loading={isSubmitting}>{supplier ? 'Save Changes' : 'Add Supplier'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ------------------------------ Movement history ----------------------------- */

const TransactionsTable = ({ type, refreshKey }) => {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(() => inventoryService.getTransactions({ type, page, limit: 10 }), [type, page, refreshKey]);
  const rows = data?.data || [];

  useEffect(() => { setPage(1); }, [type]);

  if (loading) return <TableSkeleton cols={7} />;
  if (rows.length === 0) {
    return <div className="card"><EmptyState icon={HiOutlineSwitchVertical} title={`No ${type}s recorded yet`} message='Use "Update stock" on a product to record one.' /></div>;
  }
  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Unit price</th><th>Total</th>{type === 'purchase' && <th>Supplier</th>}<th>Balance</th><th>Recorded by</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap">{formatDateTime(row.createdAt)}</td>
                <td>
                  <p className="font-medium text-gray-900">{row.item?.name || 'Deleted product'}</p>
                  {row.note && <p className="text-xs text-gray-500">{row.note}</p>}
                </td>
                <td><span className={TYPE_BADGES[row.type]}>{humanize(row.type)}</span></td>
                <td>{row.quantity} {row.item?.unit}</td>
                <td>{formatCurrency(row.unitPrice)}</td>
                <td className="font-medium">{formatCurrency(row.total)}</td>
                {type === 'purchase' && <td>{row.supplier?.name || '-'}</td>}
                <td>{row.balanceAfter}</td>
                <td>{row.createdBy?.name || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={data.pagination} onPageChange={setPage} />
    </>
  );
};

/* ----------------------------------- Page ----------------------------------- */

/** Inventory: products and stock levels, low-stock alerts, purchases, sales and suppliers. */
const AdminInventory = () => {
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState(undefined);
  const [stockItem, setStockItem] = useState(null);
  const [editingSupplier, setEditingSupplier] = useState(undefined);
  const [deleting, setDeleting] = useState(null); // { kind: 'product' | 'supplier', record }
  const [working, setWorking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const debouncedSearch = useDebounce(search);

  const products = useFetch(
    () => inventoryService.getAll(cleanParams({ search: debouncedSearch, lowStock: lowStockOnly ? 'true' : '', page, limit: 10 })),
    [debouncedSearch, lowStockOnly, page]
  );
  const suppliers = useFetch(() => inventoryService.getSuppliers());
  const supplierList = suppliers.data?.data || [];
  const items = products.data?.data || [];
  const summary = products.data?.summary;

  useEffect(() => { setPage(1); }, [debouncedSearch, lowStockOnly]);

  const afterStockChange = () => {
    products.refetch();
    setRefreshKey((key) => key + 1);
  };

  const confirmDelete = async () => {
    setWorking(true);
    try {
      if (deleting.kind === 'product') await inventoryService.remove(deleting.record.id);
      else await inventoryService.removeSupplier(deleting.record.id);
      toast.success(`${humanize(deleting.kind)} deleted`);
      setDeleting(null);
      products.refetch();
      suppliers.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to delete'));
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Products, stock levels, suppliers and stock movements.">
        {tab === 'suppliers'
          ? <Button size="sm" onClick={() => setEditingSupplier(null)}><HiOutlinePlus className="w-4 h-4" /> Add Supplier</Button>
          : <Button size="sm" onClick={() => setEditingItem(null)}><HiOutlinePlus className="w-4 h-4" /> Add Product</Button>}
      </PageHeader>

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatsCard title="Products" value={summary.products} icon={HiOutlineCube} color="blue" />
          <StatsCard title="Units in Stock" value={summary.units} icon={HiOutlineArchive} color="purple" delay={0.05} />
          <StatsCard title="Stock Value (cost)" value={formatCurrency(summary.stockValue)} icon={HiOutlineCurrencyDollar} color="green" delay={0.1} />
          <StatsCard title="Low Stock Alerts" value={summary.lowStockCount} icon={HiOutlineExclamation} color={summary.lowStockCount ? 'red' : 'gray'} subtitle="At or below reorder level" delay={0.15} />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4" role="tablist">
        {TABS.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={tab === item.value} onClick={() => setTab(item.value)} className={`tab ${tab === item.value ? 'tab-active' : 'bg-white shadow-sm'}`}>
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'products' && (
        <>
          <div className="card !p-4 mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by product name or SKU..." className="flex-1" />
            <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
              <input type="checkbox" className="w-4 h-4 accent-gold-500" checked={lowStockOnly} onChange={(event) => setLowStockOnly(event.target.checked)} />
              Low stock only
            </label>
          </div>

          {products.loading ? (
            <TableSkeleton cols={7} rows={8} />
          ) : items.length === 0 ? (
            <div className="card"><EmptyState icon={HiOutlineArchive} title={lowStockOnly ? 'Nothing is running low' : 'No products found'} message={lowStockOnly ? 'Every product is above its reorder level.' : 'Add your first product to start tracking stock.'} /></div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr><th>Product</th><th>Category</th><th>Supplier</th><th>In stock</th><th>Cost</th><th>Selling</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{item.sku}</p>
                        </td>
                        <td>{item.category}</td>
                        <td>{item.supplier?.name || '-'}</td>
                        <td>
                          <span className="font-semibold text-gray-900">{item.quantity}</span> {item.unit}
                          {item.isLowStock && (
                            <span className="badge-red ml-2"><HiOutlineExclamation className="w-3.5 h-3.5 mr-1" />{item.quantity === 0 ? 'Out of stock' : 'Low stock'}</span>
                          )}
                          <span className="block text-xs text-gray-400">Reorder at {item.reorderLevel}</span>
                        </td>
                        <td>{formatCurrency(item.costPrice)}</td>
                        <td>{item.sellingPrice ? formatCurrency(item.sellingPrice) : <span className="text-gray-400">Not for sale</span>}</td>
                        <td>
                          <div className="flex items-center justify-end gap-0.5">
                            <Button size="sm" variant="outline" onClick={() => setStockItem(item)}>Update stock</Button>
                            <button type="button" className="icon-btn" title="Edit" aria-label="Edit" onClick={() => setEditingItem(item)}><HiOutlinePencil className="w-5 h-5" /></button>
                            <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setDeleting({ kind: 'product', record: item })}><HiOutlineTrash className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={products.data.pagination} onPageChange={setPage} />
            </>
          )}
        </>
      )}

      {(tab === 'purchase' || tab === 'sale') && <TransactionsTable type={tab} refreshKey={refreshKey} />}

      {tab === 'suppliers' && (
        suppliers.loading ? <TableSkeleton cols={5} /> : supplierList.length === 0 ? (
          <div className="card"><EmptyState icon={HiOutlineTruck} title="No suppliers yet" action={<Button size="sm" onClick={() => setEditingSupplier(null)}>Add a supplier</Button>} /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Supplier</th><th>Contact person</th><th>Phone</th><th>Email</th><th>Address</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {supplierList.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="font-medium text-gray-900">{supplier.name}</td>
                    <td>{supplier.contactPerson || '-'}</td>
                    <td>{supplier.phone || '-'}</td>
                    <td>{supplier.email || '-'}</td>
                    <td className="max-w-xs truncate">{supplier.address || '-'}</td>
                    <td>
                      <div className="flex justify-end gap-0.5">
                        <button type="button" className="icon-btn" title="Edit" aria-label="Edit" onClick={() => setEditingSupplier(supplier)}><HiOutlinePencil className="w-5 h-5" /></button>
                        <button type="button" className="icon-btn text-red-500" title="Delete" aria-label="Delete" onClick={() => setDeleting({ kind: 'supplier', record: supplier })}><HiOutlineTrash className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <ProductForm isOpen={editingItem !== undefined} item={editingItem || null} onClose={() => setEditingItem(undefined)} onSaved={products.refetch} suppliers={supplierList} />
      <StockModal item={stockItem} onClose={() => setStockItem(null)} onSaved={afterStockChange} suppliers={supplierList} />
      <SupplierForm isOpen={editingSupplier !== undefined} supplier={editingSupplier || null} onClose={() => setEditingSupplier(undefined)} onSaved={suppliers.refetch} />
      <ConfirmDialog
        isOpen={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={working}
        title={`Delete this ${deleting?.kind}?`}
        confirmLabel="Delete"
        message={deleting?.kind === 'product'
          ? `"${deleting.record.name}" and its stock history will be permanently removed.`
          : `"${deleting?.record.name}" will be removed and unlinked from its products.`}
      />
    </div>
  );
};

export default AdminInventory;
