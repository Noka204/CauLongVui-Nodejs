import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { sendOtp, verifyOtp } from '../services/auth.service';

export default function RegisterEmail() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP & Info
  const [email, setEmail] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  // Handle countdown
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Vui lòng nhập email hợp lệ');
      return;
    }
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      setErrorMsg('Email không đúng định dạng');
      return;
    }

    try {
      setIsSendingOtp(true);
      setErrorMsg('');
      await sendOtp(email);
      setStep(2);
      setCountdown(300); // 5 minutes
    } catch (error) {
      setErrorMsg(error.message || 'Không thể gửi OTP. Vui lòng thử lại.');
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
        password: data.password
      };
      
      await verifyOtp(payload);
      // Auto redirect to login after success
      alert('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.message || 'Đăng ký thất bại. Kiểm tra lại OTP hoặc thông tin.');
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
            Đăng ký tài khoản
          </h2>
          <p className="mt-3 text-center text-sm text-slate-500 font-medium">
            {step === 1 ? 'Bước 1: Nhập email để nhận mã OTP' : 'Bước 2: Xác thực OTP và khởi tạo tài khoản'}
          </p>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
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
                placeholder="Ví dụ: caulongvui@gmail.com"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isSendingOtp}
                className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
              >
                {isSendingOtp ? 'Đang gửi...' : 'NHẬN MÃ OTP'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onRegister)}>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-slate-700">Mã OTP đã được gửi đến: <span className="font-bold text-teal-700">{email}</span></p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-slate-500">Mã còn hiệu lực trong: </span>
                <span className="text-lg font-black text-red-500">{formatTime(countdown)}</span>
              </div>
              {countdown === 0 && (
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={isSendingOtp}
                  className="mt-3 text-sm font-bold text-teal-600 hover:text-teal-700 focus:outline-none"
                >
                  {isSendingOtp ? 'Đang gửi lại...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mã OTP (6 chữ số)</label>
                <input
                  {...register("otpCode", { 
                    required: "Vui lòng nhập OTP",
                    pattern: { value: /^[0-9]{6}$/, message: "OTP phải gồm 6 chữ số" }
                  })}
                  type="text"
                  maxLength="6"
                  className="appearance-none tracking-[0.5em] text-center font-bold relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-lg transition-all"
                  placeholder="------"
                />
                {errors.otpCode && <p className="mt-1 text-sm text-red-500">{errors.otpCode.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  {...register("fullName", { required: "Họ và tên không được để trống" })}
                  type="text"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Nhập họ và tên"
                />
                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  {...register("phoneNumber", { 
                    required: "Số điện thoại không được để trống",
                    pattern: { value: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ" }
                  })}
                  type="tel"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Nhập số điện thoại"
                />
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                <input
                  {...register("password", { 
                    required: "Mật khẩu không được để trống",
                    minLength: { value: 6, message: "Mật khẩu phải từ 6 ký tự trở lên" }
                  })}
                  type="password"
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Tạo mật khẩu (ít nhất 6 ký tự)"
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
                {isSubmitting ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐĂNG KÝ'}
              </button>
            </div>
            
            <div className="text-center pt-2">
               <button type="button" onClick={() => setStep(1)} className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
                 {'< Quay lại đổi Email'}
               </button>
            </div>
          </form>
        )}

        <div className="flex flex-col items-center justify-between text-sm font-medium space-y-3 pt-4 border-t border-slate-100">
          <Link to="/login" className="text-teal-600 hover:text-teal-500 transition-colors">
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
