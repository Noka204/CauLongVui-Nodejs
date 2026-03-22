import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourts } from '../hooks/useCourts';

export default function Home() {
  const { data, isLoading } = useCourts();
  const [activeTab, setActiveTab] = useState('ALL');

  const courts = data?.items || [];
  
  const filteredCourts = activeTab === 'ALL' 
    ? courts 
    : courts.filter(c => c.isMaintenance === (activeTab === 'MAINTENANCE'));

  const availableCount = courts.filter(c => !c.isMaintenance).length;

  return (
    <div className="animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <section className="relative min-h-[90vh] flex items-center px-8 sm:px-12 overflow-hidden bg-white">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-20 w-[480px] h-[480px] bg-teal-400/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-10 right-[20%] w-[320px] h-[320px] bg-teal-400/5 blur-[80px] rounded-full" />
          
          <svg className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[600px] h-[560px] opacity-[0.03] text-slate-900" viewBox="0 0 500 500" fill="none">
            <rect x="30" y="30" width="440" height="440" stroke="currentColor" strokeWidth="2"/>
            <line x1="30" y1="250" x2="470" y2="250" stroke="currentColor" strokeWidth="2"/>
            <line x1="250" y1="30" x2="250" y2="470" stroke="currentColor" strokeWidth="2"/>
            <rect x="100" y="30" width="300" height="440" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-full">
              <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">Nền tảng đặt sân #1 Việt Nam</span>
            </div>
            
            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-slate-900 leading-[0.9]">
              Sống trọn đam mê<br />trên từng <span className="italic font-serif text-teal-600">đường cầu</span>
            </h1>
            
            <p className="text-lg text-slate-500 font-medium max-w-md leading-relaxed">
              Tìm kiếm, so sánh và đặt sân cầu lông ngay lập tức. Hệ thống tự động kiểm tra slot trống và xác nhận tức thì.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <a href="#danh-sach-san" className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:-translate-y-1 transition-all">
                Khám phá sân ngay
              </a>
              <Link to="/products" className="px-8 py-4 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-teal-600 hover:text-teal-600 transition-all">
                Xem cửa hàng
              </Link>
            </div>

            <div className="flex gap-12 pt-8 border-t border-slate-100">
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{availableCount}<span className="text-teal-600">+</span></p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Sân đang trống</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{courts.length}<span className="text-teal-600">+</span></p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Tổng số sân</p>
              </div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">24<span className="text-teal-600">/7</span></p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Hỗ trợ đặt lịch</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="relative z-10 rounded-[2rem] overflow-hidden shadow-2xl skew-y-1">
              <img 
                src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=900&q=80" 
                alt="Badminton Court" 
                className="w-full h-full object-cover aspect-[4/3]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            </div>
            
            {/* Badges */}
            <div className="absolute -bottom-6 -left-8 bg-white p-6 rounded-3xl shadow-2xl z-20 flex items-center gap-4 border border-slate-50 animate-bounce-slow">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-2xl">🏸</div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight leading-none">Đặt trong 60 giây</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Xác nhận tức thì</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEARCH/STATS BAR */}
      <section className="bg-white px-8 sm:px-12 pb-12">
        <div className="max-w-7xl mx-auto bg-slate-50 border border-slate-100 rounded-[2rem] p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 px-6 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">🔍 Tìm tên sân</p>
            <input type="text" placeholder="NHẬP TÊN SÂN..." className="bg-transparent font-black text-sm uppercase outline-none w-full border-none focus:ring-0 p-0" />
          </div>
          <div className="hidden md:block w-px h-10 bg-slate-200" />
          <div className="flex-1 px-6 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">📅 Ngày đặt</p>
            <input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="bg-transparent font-black text-sm uppercase outline-none w-full border-none focus:ring-0 p-0" />
          </div>
          <button className="bg-teal-600 text-white font-black text-xs uppercase tracking-widest px-10 py-5 rounded-2xl shadow-xl shadow-teal-600/20 hover:bg-teal-700 transition-all whitespace-nowrap">
            Tìm sân nhanh
          </button>
        </div>
      </section>

      {/* LISTING SECTION */}
      <section id="danh-sach-san" className="px-8 sm:px-12 py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">Sân nổi bật</div>
              <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">Danh Sách Sân Cầu Lông</h2>
              <p className="text-slate-500 font-medium">Tìm kiếm và đặt sân phù hợp nhất với trình độ của bạn</p>
            </div>
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                <button 
                  onClick={() => setActiveTab('ALL')}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'ALL' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Tất cả
                </button>
                <button 
                  onClick={() => setActiveTab('AVAILABLE')}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'AVAILABLE' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Đang trống
                </button>
                <button 
                  onClick={() => setActiveTab('MAINTENANCE')}
                  className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'MAINTENANCE' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Bảo trì
                </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-[2rem] bg-slate-100 animate-pulse" />
              ))
            ) : filteredCourts.slice(0, 8).map((court) => (
              <article key={court.id} className="group bg-white rounded-[2rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200 transition-all hover:-translate-y-2 duration-500">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  {court.imageUrl ? (
                    <img src={`http://localhost:5000${court.imageUrl}`} alt={court.courtName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🏸</div>
                  )}
                  <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg ${court.isMaintenance ? 'bg-red-500 text-white' : 'bg-teal-500 text-white'}`}>
                    ● {court.isMaintenance ? 'Bảo trì' : 'Đang mở'}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight line-clamp-1">{court.courtName}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">📍 TP. Hồ Chí Minh</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giá từ</p>
                      <p className="text-xl font-black text-teal-600 mt-0.5">80K<span className="text-[10px] text-slate-400 ml-1">/giờ</span></p>
                    </div>
                    <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-colors shadow-lg shadow-slate-900/10">
                      Chi tiết
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* REASONS SECTION */}
      <section className="bg-slate-900 py-32 px-8 sm:px-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 blur-[120px] rounded-full" />
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-6">
            <div className="text-[10px] font-black text-teal-400 uppercase tracking-[0.2em]">Tại sao chọn chúng tôi</div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight">Đặt sân thông minh,<br />chơi thoải mái hơn</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed">Chúng tôi mang lại trải nghiệm đặt sân đơn giản, nhanh chóng và đáng tin cậy nhất cho cộng đồng cầu lông.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-teal-500/10 transition-colors group">
              <div className="text-3xl mb-4 transform group-hover:scale-125 transition-transform"></div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Đặt sân tức thì</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Xác nhận ngay lập tức, không cần chờ gọi điện hay nhắn tin.</p>
            </div>
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:bg-teal-500/10 transition-colors group">
              <div className="text-3xl mb-4 transform group-hover:scale-125 transition-transform"></div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2">Cập nhật liên tục</h4>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Trạng thái sân được cập nhật liên tục, luôn chính xác nhất.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-8 sm:px-12 text-center bg-white">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">Bắt đầu ngay hôm nay</div>
          <h2 className="text-5xl sm:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-none">Sẵn sàng cho <span className="italic font-serif text-teal-600">trận đấu</span> tiếp theo?</h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">Hệ thống đặt sân 24/7. Sân tiêu chuẩn, giá cả hợp lý, dụng cụ chất lượng cao — tất cả trong một nền tảng.</p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <button className="px-10 py-5 bg-teal-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-teal-600/30 hover:bg-teal-700 hover:-translate-y-1 transition-all">
              Tìm sân ngay bây giờ
            </button>
            <Link to="/products" className="px-10 py-5 bg-white text-slate-900 border-2 border-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:border-teal-600 hover:text-teal-600 transition-all">
              Xem cửa hàng →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
