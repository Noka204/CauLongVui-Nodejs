import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/auth.service';
import { getApiBaseUrl } from '../services/api.client';

const normalizeRegisterErrorMessage = (message) => {
  if (!message) return 'Dang ky that bai. Kiem tra lai OTP hoac thong tin.';

  if (message.includes('Customer role not configured')) {
    return 'He thong chua cau hinh quyen Customer. Vui long lien he quan tri vien.';
  }

  if (message.includes('Invalid or expired OTP')) {
    return 'Ma OTP khong dung hoac da het han.';
  }

  if (message.includes('Phone number already exists')) {
    return 'So dien thoai da ton tai.';
  }

  if (message.includes('Email already registered')) {
    return 'Email da duoc dang ky.';
  }

  return message;
};

export default function RegisterEmail() {
  const apiBaseUrl = getApiBaseUrl();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSendOtp = async (e) => {
    e.preventDefault();

    if (!email) {
      setErrorMsg('Vui long nhap email hop le');
      return;
    }

    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      setErrorMsg('Email khong dung dinh dang');
      return;
    }

    try {
      setIsSendingOtp(true);
      setErrorMsg('');
      setInfoMsg('');

      const otpResponse = await sendOtp(email);
      const devOtp = otpResponse?.data?.devOtp;
      if (devOtp) {
        setInfoMsg(`DEV OTP: ${devOtp} (chi dung de test local)`);
      }

      setStep(2);
      setCountdown(300);
    } catch (error) {
      console.error('sendOtp error:', error);
      const message = error?.message || 'Khong the gui OTP. Vui long thu lai.';
      const suffix = error?.status ? ` (HTTP ${error.status})` : ' (Khong ket noi duoc API)';
      setErrorMsg(`${message}${suffix}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const onRegister = async (data) => {
    try {
      setErrorMsg('');

      const payload = {
        email,
        otpCode: data.otpCode,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        password: data.password,
      };

      await verifyOtp(payload);
      alert('Dang ky thanh cong! Vui long dang nhap.');
      navigate('/login');
    } catch (error) {
      console.error('verifyOtp error:', error);
      setErrorMsg(normalizeRegisterErrorMessage(error.message));
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-teal-100/50">
        <div>
          <h2 className="mt-2 text-center text-3xl font-black text-slate-900 tracking-tight">
            Dang ky tai khoan
          </h2>
          <p className="mt-3 text-center text-sm text-slate-500 font-medium">
            {step === 1 ? 'Buoc 1: Nhap email de nhan ma OTP' : 'Buoc 2: Xac thuc OTP va khoi tao tai khoan'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        {infoMsg && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md">
            <p className="text-sm text-blue-700 font-medium">{infoMsg}</p>
          </div>
        )}

        {step === 1 && (
          <form className="mt-8 space-y-6" onSubmit={onSendOtp}>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Vi du: caulongvui@gmail.com"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
              >
                {isSendingOtp ? 'Dang gui...' : 'NHAN MA OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onRegister)}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-slate-700">
                Ma OTP da duoc gui den: <span className="font-bold text-teal-700">{email}</span>
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-slate-500">Ma con hieu luc trong:</span>
                <span className="text-lg font-black text-red-500">{formatTime(countdown)}</span>
              </div>
              {countdown === 0 && (
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={isSendingOtp}
                  className="mt-3 text-sm font-bold text-teal-600 hover:text-teal-700 focus:outline-none"
                >
                  {isSendingOtp ? 'Dang gui lai...' : 'Gui lai ma OTP'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ma OTP (6 chu so)</label>
                <input
                  {...register('otpCode', {
                    required: 'Vui long nhap OTP',
                    pattern: { value: /^[0-9]{6}$/, message: 'OTP phai gom 6 chu so' },
                  })}
                  type="text"
                  maxLength="6"
                  className="appearance-none tracking-[0.5em] text-center font-bold relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-lg transition-all"
                  placeholder="------"
                />
                {errors.otpCode && <p className="mt-1 text-sm text-red-500">{errors.otpCode.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ho va ten</label>
                <input
                  {...register('fullName', { required: 'Ho va ten khong duoc de trong' })}
                  type="text"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Nhap ho va ten"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">So dien thoai</label>
                <input
                  {...register('phoneNumber', {
                    required: 'So dien thoai khong duoc de trong',
                    pattern: { value: /^[0-9]{10,11}$/, message: 'So dien thoai khong hop le' },
                  })}
                  type="tel"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Nhap so dien thoai"
                />
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mat khau</label>
                <input
                  {...register('password', {
                    required: 'Mat khau khong duoc de trong',
                    minLength: { value: 6, message: 'Mat khau phai tu 6 ky tu tro len' },
                  })}
                  type="password"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Tao mat khau (it nhat 6 ky tu)"
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || countdown === 0}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
              >
                {isSubmitting ? 'DANG XU LY...' : 'HOAN TAT DANG KY'}
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                {'< Quay lai doi Email'}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col items-center justify-between text-sm font-medium space-y-3 pt-4 border-t border-slate-100">
          <Link to="/login" className="text-teal-600 hover:text-teal-500 transition-colors">
            Da co tai khoan? Dang nhap
          </Link>
          <p className="text-[11px] text-slate-400 font-bold">API: {apiBaseUrl}</p>
        </div>
      </div>
    </div>
  );
}
