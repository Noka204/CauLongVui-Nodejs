import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PaymentResult() {
  const location = useLocation();
  const search = new URLSearchParams(location.search);

  const payStatus = search.get('pay');
  const gateway = search.get('gw') || '--';
  const paymentId = search.get('paymentId') || '--';
  const amount = search.get('amount');

  const isSuccess = payStatus === 'success';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-xl bg-white border border-slate-100 rounded-3xl shadow-soft p-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ket qua thanh toan</p>

        <h1
          className={`mt-3 text-2xl font-black uppercase tracking-tight ${
            isSuccess ? 'text-teal-600' : 'text-red-500'
          }`}
        >
          {isSuccess ? 'Thanh toan thanh cong' : 'Thanh toan that bai'}
        </h1>

        <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left space-y-2 text-sm font-bold text-slate-600">
          <p>Gateway: {gateway.toUpperCase()}</p>
          <p>Payment ID: {paymentId}</p>
          {amount ? <p>So tien: {Number(amount).toLocaleString('vi-VN')} VND</p> : null}
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/profile"
            className="px-5 py-3 rounded-xl bg-teal-600 text-white text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-colors"
          >
            Ve profile
          </Link>
          <Link
            to="/"
            className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
          >
            Trang chu
          </Link>
        </div>
      </div>
    </div>
  );
}
