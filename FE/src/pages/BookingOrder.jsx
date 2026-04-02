import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useBookingDetail } from '../hooks/useBookings';
import { useProducts } from '../hooks/useProducts';
import { useOrders, useCreateOrder } from '../hooks/useOrders';
import { usePayments, useCreatePayment, useCreateMomoPayment } from '../hooks/usePayments';
import { getApiOrigin } from '../services/api.client';

const normalizeId = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id || value._id || '';
};

const formatMoney = (value) => `${Number(value || 0).toLocaleString('vi-VN')} VND`;

const formatDate = (value) => {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('vi-VN');
};

const paymentBadgeClass = (status) => {
  if (status === 'Success') return 'bg-teal-50 text-teal-700 border-teal-100';
  if (status === 'Failed') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${getApiOrigin()}${path}`;
  return path;
};

export default function BookingOrder() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const user = useMemo(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }, []);

  const [customerName, setCustomerName] = useState(user?.fullName || '');
  const [paymentMethod, setPaymentMethod] = useState('MoMo');
  const [cart, setCart] = useState({});
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentQr, setPaymentQr] = useState(null);
  const [watchingOrderId, setWatchingOrderId] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [navigate, user]);

  const bookingQuery = useBookingDetail(bookingId, { enabled: !!bookingId && !!user });
  const productsQuery = useProducts({ page: 1, limit: 200, status: 'Active' }, { enabled: !!user });
  const ordersQuery = useOrders({ page: 1, limit: 100, bookingId }, { enabled: !!bookingId && !!user });
  const paymentListQuery = usePayments({ page: 1, limit: 500 }, { enabled: !!user });
  const watchingPaymentQuery = usePayments(
    { page: 1, limit: 20, orderId: watchingOrderId || undefined },
    {
      enabled: Boolean(watchingOrderId),
      refetchInterval: paymentQr ? 4000 : false,
    }
  );

  const createOrderMutation = useCreateOrder();
  const createPaymentMutation = useCreatePayment();
  const createMomoMutation = useCreateMomoPayment();

  const products = useMemo(() => productsQuery.data?.items || [], [productsQuery.data]);
  const menuProducts = useMemo(
    () => products.filter((product) => product.type === 'Food' || product.type === 'Drink'),
    [products]
  );

  const productMap = useMemo(() => {
    return new Map(menuProducts.map((product) => [normalizeId(product.id || product._id), product]));
  }, [menuProducts]);

  const groupedProducts = useMemo(() => {
    return {
      Food: menuProducts.filter((product) => product.type === 'Food'),
      Drink: menuProducts.filter((product) => product.type === 'Drink'),
    };
  }, [menuProducts]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => ({
        productId,
        quantity,
        product: productMap.get(productId),
      }))
      .filter((item) => item.product && item.quantity > 0);
  }, [cart, productMap]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.product.price || 0) * item.quantity, 0);
  }, [cartItems]);

  const paymentMapByOrderId = useMemo(() => {
    const map = new Map();
    const payments = paymentListQuery.data?.items || [];

    for (const payment of payments) {
      const orderId = normalizeId(payment.orderId);
      if (!orderId) continue;
      if (!map.has(orderId)) {
        map.set(orderId, payment);
      }
    }

    return map;
  }, [paymentListQuery.data]);

  const orderHistory = useMemo(() => ordersQuery.data?.items || [], [ordersQuery.data]);

  useEffect(() => {
    if (!paymentQr) return;

    const payments = watchingPaymentQuery.data?.items || [];
    const payment = payments.find((item) => normalizeId(item.id || item._id) === normalizeId(paymentQr.paymentId));

    if (!payment) return;

    if (payment.status === 'Success') {
      setMessage({ type: 'success', text: 'Thanh toan MoMo thanh cong. Don da duoc gui cho nhan vien.' });
      setPaymentQr(null);
      setWatchingOrderId('');
      ordersQuery.refetch();
      paymentListQuery.refetch();
    }

    if (payment.status === 'Failed') {
      setMessage({ type: 'error', text: 'Thanh toan MoMo that bai. Ban co the tao lai thanh toan.' });
    }
  }, [ordersQuery, paymentListQuery, paymentQr, watchingPaymentQuery.data]);

  const isMutating =
    isSubmitting ||
    createOrderMutation.isPending ||
    createPaymentMutation.isPending ||
    createMomoMutation.isPending;

  const isLoading = bookingQuery.isLoading || productsQuery.isLoading || ordersQuery.isLoading;
  const loadError = bookingQuery.error || productsQuery.error || ordersQuery.error;

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center">Dang tai...</div>;
  }

  const booking = bookingQuery.data;

  function updateCart(productId, nextQuantity) {
    setCart((prev) => {
      const safeQuantity = Math.max(0, nextQuantity);
      if (safeQuantity === 0) {
        const { [productId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: safeQuantity };
    });
  }

  function increase(productId) {
    const current = Number(cart[productId] || 0);
    updateCart(productId, current + 1);
  }

  function decrease(productId) {
    const current = Number(cart[productId] || 0);
    updateCart(productId, current - 1);
  }

  async function handleSubmitOrder(event) {
    event.preventDefault();

    if (!booking) {
      setMessage({ type: 'error', text: 'Khong tim thay booking de tao order.' });
      return;
    }

    if (!customerName.trim()) {
      setMessage({ type: 'error', text: 'Vui long nhap ten khach hang.' });
      return;
    }

    if (cartItems.length === 0) {
      setMessage({ type: 'error', text: 'Ban chua chon mon nao.' });
      return;
    }

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const createdOrder = await createOrderMutation.mutateAsync({
        bookingId,
        courtId: normalizeId(booking.courtId),
        customerName: customerName.trim(),
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      const createdOrderId = normalizeId(createdOrder.id || createdOrder._id);

      if (paymentMethod === 'Cash') {
        await createPaymentMutation.mutateAsync({
          orderId: createdOrderId,
          paymentMethod: 'Cash',
        });

        setMessage({
          type: 'success',
          text: 'Da tao order thanh cong. Vui long thanh toan tien mat cho nhan vien.',
        });
        setPaymentQr(null);
        setWatchingOrderId('');
      } else {
        const momoResult = await createMomoMutation.mutateAsync({
          orderId: createdOrderId,
          fullName: customerName.trim(),
        });

        setPaymentQr({
          payUrl: momoResult.payUrl,
          paymentId: momoResult.paymentId,
          orderId: createdOrderId,
        });
        setWatchingOrderId(createdOrderId);
        setMessage({
          type: 'info',
          text: 'Don da tao. Ban vui long quet QR MoMo de thanh toan.',
        });
      }

      setCart({});
      ordersQuery.refetch();
      paymentListQuery.refetch();
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Khong the tao order. Vui long thu lai.' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[85vh] bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="bg-white rounded-3xl border border-slate-100 shadow-soft p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Order tai san</p>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight mt-2">Menu do an - nuoc uong</h1>
            {booking ? (
              <p className="text-sm font-bold text-slate-500 mt-2">
                Booking #{normalizeId(booking.id || booking._id).slice(-8)} - {formatDate(booking.bookingDate)}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/profile"
              className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Ve lich su dat san
            </Link>
            <Button type="button" variant="secondary" onClick={() => navigate('/')}>Trang chu</Button>
          </div>
        </header>

        {isLoading ? (
          <div className="bento-card text-xs font-black uppercase text-slate-400">Dang tai menu...</div>
        ) : null}

        {loadError ? (
          <div className="bento-card border-red-100 bg-red-50 text-red-600 text-sm font-bold">
            {loadError.message || 'Khong the tai du lieu. Vui long thu lai.'}
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            <section className="xl:col-span-2 space-y-6">
              {['Food', 'Drink'].map((type) => (
                <article key={type} className="bento-card">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">{type === 'Food' ? 'Do an' : 'Nuoc uong'}</h2>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      {groupedProducts[type].length} mon
                    </span>
                  </div>

                  {groupedProducts[type].length === 0 ? (
                    <p className="text-sm font-bold text-slate-400 mt-4">Chua co san pham trong nhom nay.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {groupedProducts[type].map((product) => {
                        const productId = normalizeId(product.id || product._id);
                        const quantity = Number(cart[productId] || 0);

                        return (
                          <article key={productId} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 flex gap-4">
                            <div className="w-20 h-20 rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0">
                              {product.image ? (
                                <img
                                  src={resolveImageUrl(product.image)}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate">{product.name}</p>
                              <p className="text-xs font-black text-teal-600 mt-1">{formatMoney(product.price)}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">Ton kho: {product.stockQuantity}</p>

                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => decrease(productId)}
                                  disabled={quantity <= 0 || isMutating}
                                  className="w-7 h-7 rounded-lg border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs font-black text-slate-900">{quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => increase(productId)}
                                  disabled={quantity >= Number(product.stockQuantity || 0) || isMutating}
                                  className="w-7 h-7 rounded-lg border border-slate-200 text-sm font-black text-slate-500 hover:bg-slate-100 disabled:opacity-40"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </article>
              ))}
            </section>

            <aside className="space-y-6 sticky top-24">
              <section className="bento-card">
                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Gio hang</h2>

                {cartItems.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                    Ban chua chon mon nao.
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {cartItems.map((item) => (
                      <li key={item.productId} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.product.name}</p>
                        <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>{item.quantity} x {formatMoney(item.product.price)}</span>
                          <span className="text-slate-900 font-black">{formatMoney(item.quantity * Number(item.product.price || 0))}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Tong tien</p>
                  <p className="text-lg font-black text-teal-600">{formatMoney(cartTotal)}</p>
                </div>

                <form onSubmit={handleSubmitOrder} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ten khach hang</label>
                    <input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 text-sm font-bold"
                      placeholder="Nhap ten nguoi dat"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phuong thuc thanh toan</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('MoMo')}
                        className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                          paymentMethod === 'MoMo'
                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        MoMo QR
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cash')}
                        className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                          paymentMethod === 'Cash'
                            ? 'bg-teal-50 border-teal-500 text-teal-700'
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Tien Mat
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" isLoading={isMutating}>
                    Tao order va thanh toan
                  </Button>
                </form>

                {message.text ? (
                  <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm font-bold ${
                      message.type === 'success'
                        ? 'bg-teal-50 border-teal-100 text-teal-700'
                        : message.type === 'error'
                          ? 'bg-red-50 border-red-100 text-red-600'
                          : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}
              </section>

              {paymentQr ? (
                <section className="bento-card border-teal-100 bg-teal-50/50">
                  <h3 className="text-sm font-black uppercase tracking-widest text-teal-700">Quet QR MoMo</h3>
                  <p className="text-xs font-bold text-teal-700/80 mt-2">
                    Don #{paymentQr.orderId.slice(-8)} dang cho thanh toan.
                  </p>

                  <div className="mt-4 bg-white rounded-2xl border border-teal-100 p-4">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentQr.payUrl)}`}
                      alt="MoMo QR"
                      className="w-full rounded-xl border border-slate-100"
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <a
                      href={paymentQr.payUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-black uppercase tracking-widest hover:bg-teal-700"
                    >
                      Mo link thanh toan
                    </a>
                    <Button type="button" variant="secondary" className="w-full" onClick={() => watchingPaymentQuery.refetch()}>
                      Toi da thanh toan
                    </Button>
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        ) : null}

        {!isLoading && !loadError ? (
          <section className="bento-card">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">Lich su order booking nay</h2>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {orderHistory.length} don
              </span>
            </header>

            {orderHistory.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-bold text-slate-500">
                Chua co order nao cho booking nay.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {orderHistory.map((order) => {
                  const orderId = normalizeId(order.id || order._id);
                  const payment = paymentMapByOrderId.get(orderId);

                  return (
                    <article
                      key={orderId}
                      className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">Order #{orderId.slice(-8)}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">Tong mon: {order.items?.length || 0} | Tong: {formatMoney(order.totalAmount)}</p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border-amber-100">
                          {order.status}
                        </span>
                        {payment ? (
                          <span className={`inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${paymentBadgeClass(payment.status)}`}>
                            {payment.paymentMethod} - {payment.status}
                          </span>
                        ) : (
                          <span className="inline-flex px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-slate-200">
                            Chua thanh toan
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
}
