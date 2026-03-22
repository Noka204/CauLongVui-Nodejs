const transporter = require('../../config/mailer');
const env = require('../../config/env');
const dayjs = require('dayjs');
const { formatMoney } = require('../../utils/formatMoney');

/**
 * Gửi email chứa mã OTP đăng ký
 * @param {string} email 
 * @param {string} otpCode 
 */
const sendOtpEmail = async (email, otpCode) => {
  const mailOptions = {
    from: env.GMAIL_FROM,
    to: email,
    subject: '[Cầu Lông Vui] Mã xác thực đăng ký tài khoản',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0f766e;">Cầu Lông Vui</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại Cầu Lông Vui. Mã xác thực (OTP) của bạn là:</p>
        <h1 style="color: #0d9488; font-size: 32px; letter-spacing: 5px; background: #f0fdfa; padding: 15px; border-radius: 8px; display: inline-block;">${otpCode}</h1>
        <p>Mã này sẽ hết hạn sau <strong>5 phút</strong>.</p>
        <p>Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <br>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ Cầu Lông Vui</strong></p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Gửi email thông báo đặt sân thành công
 * @param {string} email 
 * @param {Object} booking 
 * @param {Object} court 
 */
const sendBookingConfirmationEmail = async (email, booking, court) => {
  if (!email) return;

  const formattedDate = dayjs(booking.date).format('DD/MM/YYYY');
  const detailsHtml = booking.details.map(d => 
    `<li>Sân: ${d.courtName} - Khung giờ: ${d.startTime} đến ${d.endTime} (Giá: ${formatMoney(d.price)})</li>`
  ).join('');

  const mailOptions = {
    from: env.GMAIL_FROM,
    to: email,
    subject: '[Cầu Lông Vui] Xác nhận đặt sân thành công',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #0f766e; margin: 0;">Xác nhận đặt sân thành công</h2>
        </div>
        
        <p>Xin chào ${booking.customerName || 'Quý khách'},</p>
        <p>Cảm ơn bạn đã đặt sân tại <strong>${court?.name || 'Cầu Lông Vui'}</strong>. Dưới đây là thông tin chi tiết hóa đơn của bạn:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Mã hóa đơn:</strong> #${booking._id.toString().slice(-8).toUpperCase()}</p>
          <p style="margin: 5px 0;"><strong>Ngày đặt:</strong> ${formattedDate}</p>
          <p style="margin: 5px 0;"><strong>Tổng tiền chi trả:</strong> <span style="color: #ef4444; font-weight: bold;">${formatMoney(booking.totalPrice)}</span></p>
          
          <h4 style="margin-top: 15px; margin-bottom: 10px; color: #334155;">Chi tiết các khung giờ:</h4>
          <ul style="margin: 0; padding-left: 20px; color: #475569;">
            ${detailsHtml}
          </ul>
        </div>

        <p>Chúc bạn có những giờ phút chơi cầu lông vui vẻ!</p>
        <br>
        <p>Trân trọng,</p>
        <p><strong>Cầu Lông Vui</strong></p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Lỗi khi gửi email xác nhận đặt sân:', error);
    // Lưu ý: Không ném lỗi ra ngoài để tránh làm ảnh hưởng luồng webhook/IPN
  }
};

module.exports = {
  sendOtpEmail,
  sendBookingConfirmationEmail,
};
