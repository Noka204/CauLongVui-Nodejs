import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail } from '../services/auth.service';

export default function LoginEmail() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data) => {
    try {
      setErrorMsg('');
      const response = await loginWithEmail(data);
      localStorage.setItem('token', response.tokens.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      window.dispatchEvent(new Event('user-login'));
      // Navigate based on role or just to home
      if (response.user.roleName === 'Admin' || response.user.roleName === 'Manager') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-teal-100/50">
        <div>
          <h2 className="mt-2 text-center text-3xl font-black text-slate-900 tracking-tight">
            Đăng nhập với Gmail
          </h2>
          <p className="mt-3 text-center text-sm text-slate-500 font-medium">
            Điền thông tin email và mật khẩu của bạn
          </p>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
            <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
              <input
                {...register("email", { 
                  required: "Email không được để trống",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Email không hợp lệ"
                  }
                })}
                type="email"
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Ví dụ: caulongvui@gmail.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
              <input
                {...register("password", { required: "Mật khẩu không được để trống" })}
                type="password"
                className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm transition-all"
                placeholder="Nhập mật khẩu"
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50"
            >
              {isSubmitting ? 'Đang xử lý...' : 'ĐĂNG NHẬP'}
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-between text-sm font-medium space-y-3 pt-2">
            <Link to="/register" className="text-teal-600 hover:text-teal-500 transition-colors">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
