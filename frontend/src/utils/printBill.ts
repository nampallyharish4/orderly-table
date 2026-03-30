import { Order } from '@/types';
import { format } from 'date-fns';

interface RestaurantPrintDetails {
  restaurantName?: string;
  address?: string;
  phone?: string;
  email?: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function printBill(order: Order, restaurant?: RestaurantPrintDetails) {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert('Please allow popups to print the bill');
    return;
  }

  const restaurantName = escapeHtml(
    restaurant?.restaurantName?.trim() || 'Restaurant',
  );
  const restaurantAddress = escapeHtml(restaurant?.address?.trim() || '');
  const restaurantPhone = escapeHtml(restaurant?.phone?.trim() || '');
  const restaurantEmail = escapeHtml(restaurant?.email?.trim() || '');

  const billContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Bill - ${order.orderNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Courier New', monospace;
          padding: 20px;
          max-width: 300px;
          margin: 0 auto;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .header h1 {
          font-size: 18px;
          margin-bottom: 5px;
        }
        .header p {
          font-size: 11px;
          color: #666;
        }
        .order-info {
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px dashed #000;
        }
        .order-info p {
          margin: 3px 0;
        }
        .items {
          margin-bottom: 15px;
        }
        .item {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .item-name {
          flex: 1;
        }
        .item-qty {
          width: 30px;
          text-align: center;
        }
        .item-price {
          width: 60px;
          text-align: right;
        }
        .divider {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }
        .total {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          font-size: 14px;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px dashed #000;
          font-size: 11px;
        }
        .paid-stamp-container {
          position: relative;
          height: 0;
          overflow: visible;
        }
        .paid-stamp {
          position: absolute;
          top: -120px;
          left: 50%;
          transform: translateX(-50%) rotate(-15deg);
          width: 100px;
          height: 100px;
          border: 3px solid rgba(74, 0, 128, 0.35);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.4;
        }
        .paid-stamp::before {
          content: '';
          position: absolute;
          width: 90px;
          height: 90px;
          border: 1px solid rgba(74, 0, 128, 0.35);
          border-radius: 50%;
        }
        .paid-stamp-text {
          font-size: 24px;
          font-weight: bold;
          color: rgba(74, 0, 128, 0.6);
          letter-spacing: 2px;
        }
        .stamp-outer-text {
          position: absolute;
          width: 100%;
          height: 100%;
          font-size: 8px;
          color: rgba(74, 0, 128, 0.6);
          font-weight: bold;
        }
        .stamp-top {
          position: absolute;
          top: 8px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }
        .stamp-bottom {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          white-space: nowrap;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${restaurantName}</h1>
        ${restaurantAddress ? `<p>${restaurantAddress}</p>` : ''}
        ${restaurantPhone ? `<p>Ph: ${restaurantPhone}</p>` : ''}
        ${restaurantEmail ? `<p>${restaurantEmail}</p>` : ''}
      </div>
      
      <div class="order-info">
        <p><strong>Order:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${format(order.createdAt, 'dd/MM/yyyy hh:mm a')}</p>
        <p><strong>Type:</strong> ${order.orderType === 'dine-in' ? `Dine-In (Table ${order.tableNumber})` : 'Takeaway'}</p>
        ${order.customerName ? `<p><strong>Customer:</strong> ${order.customerName}</p>` : ''}
        ${order.customerPhone ? `<p><strong>Phone:</strong> ${order.customerPhone}</p>` : ''}
      </div>
      
      <div class="items">
        <div class="item" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
          <span class="item-name">Item</span>
          <span class="item-qty">Qty</span>
          <span class="item-price">Amount</span>
        </div>
        ${order.items
          .map(
            (item) => `
          <div class="item">
            <span class="item-name">${item.menuItemName}</span>
            <span class="item-qty">${item.quantity}</span>
            <span class="item-price">₹${item.totalPrice.toFixed(0)}</span>
          </div>
        `,
          )
          .join('')}
      </div>
      
      <div class="total">
        <span>TOTAL</span>
        <span>₹${order.totalAmount.toFixed(0)}</span>
      </div>
      
      <div class="paid-stamp-container">
        <div class="paid-stamp">
          <div class="stamp-outer-text">
            <span class="stamp-top">★ ${restaurantName} ★</span>
            ${restaurantAddress ? `<span class="stamp-bottom">★ ${restaurantAddress} ★</span>` : ''}
          </div>
          <span class="paid-stamp-text">PAID</span>
        </div>
      </div>
      
      <div class="footer">
        <p>Thank you for dining with us!</p>
        <p>Visit Again</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(billContent);
  printWindow.document.close();
}
