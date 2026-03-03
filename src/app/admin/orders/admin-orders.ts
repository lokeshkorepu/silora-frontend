import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { NotificationService } from '../../core/services/notification.service';
import { AdminNotificationService } from '../../core/services/admin-notification.service';
import { AuthService } from '../../core/auth/auth.service';
import confetti from 'canvas-confetti';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { inject } from '@angular/core';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  writeBatch,
  Timestamp,
  Firestore,
  doc,
  getDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.html',
  styleUrls: ['./admin-orders.css']
})
export class AdminOrdersComponent implements OnInit {

  orders: any[] = [];
  loading = true;

  selectedStatus: string = 'All';
  searchTerm: string = '';

  highlightedOrders: Set<string> = new Set();

  // Pagination
  totalOrders = 0;
  lastDoc: any = null;
  currentPage: number = 1;
  pageSize: number = 100;

  // Drawer
  selectedOrder: any = null;
  isDrawerOpen = false;
  isMobile = false;

  // Timeline
  timelineSteps: string[] = ['Placed', 'Packed', 'Shipped', 'Delivered'];

  // Toast
  showToast = false;
  statusMorph = false;

  constructor(
    private orderService: OrderService,
    public notificationService: NotificationService,
    public adminNotificationService: AdminNotificationService,
    public authService: AuthService,
    private firestore: Firestore = inject(Firestore),  
  ) {}

  /* ================= INIT ================= */
  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 768;
    this.loadOrders();
    this.listenForHighlights();
  }

  get paginatedOrders() {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  return this.filteredOrders.slice(start, end);
}

get startIndex() {
  if (this.filteredOrders.length === 0) return 0;
  return (this.currentPage - 1) * this.pageSize + 1;
}

get endIndex() {
  return Math.min(
    this.currentPage * this.pageSize,
    this.filteredOrders.length
  );
}

onFilterChange() {
  this.currentPage = 1;
}

  /* ================= LOAD ORDERS ================= */
  async loadOrders() {

    const result = await this.orderService.getOrdersPaginated(this.pageSize);

    this.orders = (result.orders as any[]).map((order: any) => ({
      docId: order.docId,
      id: order.id,
      date: order.createdAt?.toDate?.()
        ? order.createdAt.toDate()
        : order.createdAt,
      total: order.totalAmount,

      status: typeof order.status === 'string'
        ? this.formatStatus(order.status)
        : this.formatStatus(order.status?.status || order.status),

      packedAt: order.packedAt?.toDate ? order.packedAt.toDate() : order.packedAt,
      shippedAt: order.shippedAt?.toDate ? order.shippedAt.toDate() : order.shippedAt,
      deliveredAt: order.deliveredAt?.toDate ? order.deliveredAt.toDate() : order.deliveredAt,

      products: order.items || []
    }));

    this.totalOrders = result.totalCount;
    this.lastDoc = result.lastDoc;
    this.loading = false;
  }

  async changePageSize(size: number) {
    this.pageSize = size;
    this.currentPage = 1; 
    this.lastDoc = null;
    await this.loadOrders();
  }

  /* ================= STATUS UPDATE ================= */
  async updateStatus(order: any) {

    const formattedStatus = order.status;
    const backendStatus = formattedStatus.toUpperCase();
    const now = new Date();

    const updateData: any = { status: backendStatus };

    if (backendStatus === 'PACKED') {
      updateData.packedAt = now;
    }

    if (backendStatus === 'SHIPPED') {
      updateData.packedAt = order.packedAt || now;
      updateData.shippedAt = now;
    }

    if (backendStatus === 'DELIVERED') {
      updateData.packedAt = order.packedAt || now;
      updateData.shippedAt = order.shippedAt || now;
      updateData.deliveredAt = now;
    }

    await this.orderService.updateOrderStatus(order.docId, updateData);

    order.status = this.formatStatus(backendStatus);

    if (updateData.packedAt) order.packedAt = updateData.packedAt;
    if (updateData.shippedAt) order.shippedAt = updateData.shippedAt;
    if (updateData.deliveredAt) order.deliveredAt = updateData.deliveredAt;

    // Sync drawer if open
    if (this.selectedOrder && this.selectedOrder.docId === order.docId) {
      this.selectedOrder.status = order.status;
      this.selectedOrder.packedAt = order.packedAt;
      this.selectedOrder.shippedAt = order.shippedAt;
      this.selectedOrder.deliveredAt = order.deliveredAt;
    }

    // 🔥 CRITICAL FIX: Sync main orders array
    const index = this.orders.findIndex(o => o.docId === order.docId);
    if (index !== -1) {
      this.orders[index] = { ...order };
    }

    this.triggerToast();

    this.statusMorph = true;
    setTimeout(() => this.statusMorph = false, 400);

    if (order.status === 'Delivered') {
      this.triggerConfetti();
    }
  } 

  /* ================= STATUS FORMAT ================= */
  private formatStatus(status: string | any): string {
    if (!status) return 'Pending';

    if (typeof status === 'object' && status.status) {
      status = status.status;
    }

    if (typeof status !== 'string') return 'Pending';

    return status.charAt(0).toUpperCase() +
           status.slice(1).toLowerCase();
  }

  /* ================= FILTER ================= */
  get filteredOrders() {
    return this.orders.filter(order => {

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      const matchesSearch =
        !this.searchTerm ||
        order.id?.toLowerCase()
          .includes(this.searchTerm.toLowerCase());

      return matchesStatus && matchesSearch;
    });
  }

  trackByOrder(index: number, order: any): string {
    return order.docId;
  }

  /* ================= TOAST ================= */
  triggerToast() {
    this.showToast = true;
    setTimeout(() => this.showToast = false, 3000);
  }

  /* ================= HIGHLIGHT NEW ORDERS ================= */
  private listenForHighlights() {

    this.adminNotificationService.getNotifications()
      .subscribe(notifications => {

        const user = this.authService.getCurrentUser();
        if (!user) return;

        const unread = notifications.filter(n =>
          !n.readBy?.includes(user.uid)
        );

        unread.forEach(n => {

          if (!this.highlightedOrders.has(n.orderId)) {

            this.highlightedOrders.add(n.orderId);

            setTimeout(() => {
              this.highlightedOrders.delete(n.orderId);
            }, 5000);
          }
        });
      });
  }

  /* ================= CLEAN OLD ORDERS ================= */
  async cleanOldOrders() {

    const confirmDelete = confirm(
      "Are you sure you want to delete orders older than 7 days?"
    );
    if (!confirmDelete) return;

    const now = new Date();
    const sevenDaysAgoDate =
      new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const sevenDaysAgo = Timestamp.fromDate(sevenDaysAgoDate);

    const ordersRef = collection(this.firestore, 'orders');

    const q = query(
      ordersRef,
      orderBy('createdAt'),
      where('createdAt', '<', sevenDaysAgo)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      alert("No old orders found.");
      return;
    }

    const batch = writeBatch(this.firestore);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();

    alert(`Deleted ${snapshot.size} old orders.`);
    await this.loadOrders();
  }

  /* ================= DRAWER ================= */
  async openDrawer(order: any) {

    document.body.style.overflow = 'hidden';

    this.selectedOrder = { ...order, products: [] };
    this.isDrawerOpen = true;

    for (let item of order.products) {

      const productDoc =
        await this.orderService.getProductById(item.productId);

      this.selectedOrder.products.push({
        ...item,
        name: productDoc?.name || 'Unknown Product',
        image: productDoc?.image || null
      });
    }
  }

 closeDrawer(): void {
  console.log('🔥 Close button clicked');

  this.isDrawerOpen = false;
  console.log('Drawer state changed:', this.isDrawerOpen);

  document.body.style.overflow = 'auto';
  console.log('Body scroll enabled');

  setTimeout(() => {
    this.selectedOrder = null;
    console.log('Selected order cleared');
  }, 300);
}

  @HostListener('document:keydown.escape')
  handleEscapeKey() {
    if (this.isDrawerOpen) {
      this.closeDrawer();
    }
  }

  /* ================= TIMELINE ================= */
  getCurrentStepIndex(status: string): number {
    return this.timelineSteps.indexOf(status);
  }

  getTimelineProgress(status: string): number {
    const index = this.getCurrentStepIndex(status);
    return (index / (this.timelineSteps.length - 1)) * 100;
  }

  getStepTime(step: string): string {

    if (!this.selectedOrder) return '—';

    switch (step) {

      case 'Placed':
        return this.selectedOrder.date
          ? new Date(this.selectedOrder.date).toLocaleString()
          : '—';

      case 'Packed':
        return this.selectedOrder.packedAt
          ? new Date(this.selectedOrder.packedAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 0 ? 'Completed' : '—');

      case 'Shipped':
        return this.selectedOrder.shippedAt
          ? new Date(this.selectedOrder.shippedAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 1 ? 'Completed' : '—');

      case 'Delivered':
        return this.selectedOrder.deliveredAt
          ? new Date(this.selectedOrder.deliveredAt).toLocaleString()
          : (this.getCurrentStepIndex(this.selectedOrder.status) > 2 ? 'Completed' : '—');

      default:
        return '—';
    }
  }

  /* ================= CONFETTI ================= */
  triggerConfetti() {
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });
  }

  /* ================= NEXT STATUS ================= */
  get nextStatus(): string | null {

    if (!this.selectedOrder) return null;

    switch (this.selectedOrder.status) {
      case 'Placed': return 'Packed';
      case 'Packed': return 'Shipped';
      case 'Shipped': return 'Delivered';
      default: return null;
    }
  }

  @HostListener('window:resize')
onResize() {
  this.isMobile = window.innerWidth <= 768;
}



getSubtotal(): number {
  if (!this.selectedOrder?.products) return 0;

  return this.selectedOrder.products.reduce(
    (sum: number, item: any) =>
      sum + (item.price * item.quantity),
    0
  );
}

getHandlingCharges(): number {
  return 10; // default admin handling fee
}

getTotal(): number {
  const subtotal = this.getSubtotal();
  const shipping = this.selectedOrder?.shipping || 0;
  const handling = this.getHandlingCharges();

  return subtotal + shipping + handling;
}

// ================= DOWNLOAD INVOICE =================
async downloadInvoice() {
  if (!this.selectedOrder) return;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const invoiceNumber = 'INV-' + Date.now();
  const today = new Date().toLocaleDateString();

  let y = 40;

  /* ================= SELLER HEADER ================= */

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Seller Name: SILORA PRIVATE LIMITED', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  y += 15;
  doc.text('Plot No:303, Srinivasa Enclave, Hastinapuram, LB Nagar, Hyderabad - 500074', margin, y);
  y += 12;
  doc.text('GSTIN: 36BKVPK6299P1ZR', margin, y);
  y += 12;
  doc.text('FSSAI: 12345678900000', margin, y);

  /* ================= QR ================= */

  const verificationURL = `https://silora.com/verify/${this.selectedOrder.id}`;
  const qrImage = await QRCode.toDataURL(verificationURL);
  doc.addImage(qrImage, 'PNG', pageWidth - 130, 40, 90, 90);

  /* ================= TITLE ================= */

  y += 30;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE / BILL OF SUPPLY', pageWidth / 2, y, { align: 'center' });

  /* ================== META BOX ================= */

  y += 20;
  doc.rect(margin, y, pageWidth - margin * 2, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  doc.text(`Invoice No: ${invoiceNumber}`, margin + 10, y + 18);
  doc.text(`Order No: ${this.selectedOrder.id}`, margin + 10, y + 34);

  doc.text(`Place Of Supply: TELANGANA (36)`, pageWidth / 2 + 60, y + 18);
  doc.text(`Date: ${today}`, pageWidth / 2 + 60, y + 34);

  /* ================== BILL TO / SHIP TO ================== */

  const lastTable = (doc as any).lastAutoTable;
  y = lastTable ? lastTable.finalY + 25 : y + 65;

  const boxWidth = (pageWidth - margin * 2) / 2;

  doc.rect(margin, y, boxWidth, 80);
  doc.rect(margin + boxWidth, y, boxWidth, 80);

  doc.setFont('helvetica', 'bold');
  doc.text('Bill To', margin + 10, y + 15);
  doc.text('Ship To', margin + boxWidth + 10, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text(this.selectedOrder.customerName || '', margin + 10, y + 30);
  doc.text(this.selectedOrder.customerAddress || '', margin + 10, y + 45, {
    maxWidth: boxWidth - 20
  });

  doc.text(this.selectedOrder.customerName || '', margin + boxWidth + 10, y + 30);
  doc.text(this.selectedOrder.customerAddress || '', margin + boxWidth + 10, y + 45, {
    maxWidth: boxWidth - 20
  });

  /* ================= PRODUCT TABLE ================= */

  y += 90;

  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;
  let grandTotal = 0;

  const hsnSummary: any = {};

  const sellerStateCode = '36';
  const customerStateCode =
    (this.selectedOrder.customerGSTIN || '36').substring(0, 2);

  const isInterState = sellerStateCode !== customerStateCode;

  const tableData = this.selectedOrder.products.map((item: any, i: number) => {

    const qty = Number(item.quantity || 0);
    const rate = Number(item.price || 0);
    const discountPercent = Number(item.discount || 0);
    const gstPercent = Number(item.gst || 0);

    const gross = qty * rate;
    const discountAmount = gross * (discountPercent / 100);
    const taxable = gross - discountAmount;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let totalIGST = 0;

    if (isInterState) {
      igstAmount = taxable * (gstPercent / 100);
    } else {
      const halfGST = gstPercent / 2;
      cgstAmount = taxable * (halfGST / 100);
      sgstAmount = taxable * (halfGST / 100);
    }

    const total = taxable + cgstAmount + sgstAmount + igstAmount;

    subtotal += taxable;
    totalCGST += cgstAmount;
    totalSGST += sgstAmount;
    totalIGST += igstAmount;
    grandTotal += total;

    // HSN Summary
    const hsn = item.hsn || '000000';

    if (!hsnSummary[hsn]) {
      hsnSummary[hsn] = { 
        taxable: 0, 
        cgst: 0, 
        sgst: 0, 
        igst: 0 
      };
    }

    hsnSummary[hsn].taxable += taxable;
    hsnSummary[hsn].cgst += cgstAmount;
    hsnSummary[hsn].sgst += sgstAmount;
    hsnSummary[hsn].igst += igstAmount;

    return [
      i + 1,
      item.name,
      rate.toFixed(2),
      hsn,
      qty,
      gstPercent.toFixed(2) + '%',
      discountPercent.toFixed(2) + '%',
      taxable.toFixed(2),
      (isInterState ? 0 : (gstPercent / 2).toFixed(2)) + '%',
      cgstAmount.toFixed(2),
      (isInterState ? 0 : (gstPercent / 2).toFixed(2)) + '%',
      sgstAmount.toFixed(2),
      (isInterState ? gstPercent.toFixed(2) : 0) + '%',
      igstAmount.toFixed(2),
      '0%',                                 
      '0.00',
      total.toFixed(2)
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center', valign: 'middle' },
    headStyles: {
    halign: 'center',
    valign: 'middle',
    fontStyle: 'bold'
  },

    columnStyles: {
        1: { halign: 'left' },   
        7: { halign: 'right' },  
        9: { halign: 'right' },  
        11: { halign: 'right' }, 
        13: { halign: 'right' }, 
        16: { halign: 'right' }  
    },

    head: [[
      'S.No','Item & Description','Unit Mrp','HSN','Qty','Rate','Disc',
      'Taxable','CGST', 'CGST Amt','SGST', 'SGST Amt','IGST', 'IGST Amt','Cess', 'Cess Amt','Total'
    ]],

    body: tableData
  });

 /* ================= TOTALS ================= */

const shipping = Number(this.selectedOrder?.shipping || 0);
const handling = 10;

const finalInvoiceValue = grandTotal + shipping + handling;
const roundedTotal = Math.round(finalInvoiceValue);

const finalY = (doc as any).lastAutoTable.finalY + 20;
const rightX = pageWidth - 40;

doc.setFontSize(10);
doc.setFont('helvetica', 'bold');

// Subtotal
doc.text('Subtotal', rightX - 150, finalY);
doc.text(`Rs. ${subtotal.toFixed(2)}`, rightX, finalY, { align: 'right' });

// Invoice Value
doc.text('Invoice Value', rightX - 150, finalY + 20);
doc.text(`Rs. ${roundedTotal.toFixed(2)}`, rightX, finalY + 20, { align: 'right' });

/* ================== Amount In Words ================== */

const amountInWords = this.numberToWords(roundedTotal);

// Same vertical starting point as totals
const wordsY = finalY;

// Left side width (half page)
const leftSectionWidth = pageWidth / 2 - margin;

doc.setFont('helvetica', 'bold');
doc.text('Amount in Words:', margin, wordsY);

doc.setFont('helvetica', 'normal');
doc.text(amountInWords, margin, wordsY + 15, {
  maxWidth: leftSectionWidth - 10
});

/* ================== GST & LEGAL NOTES ================== */

doc.setFont('times', 'normal');
doc.setFontSize(10);

const sectionY = finalY + 70;
const leftX = margin;
const leftWidth = pageWidth / 2 - margin - 20;

let noteY = sectionY;

doc.text(
  'Whether GST is payable on reverse-charge - No.',
  leftX,
  noteY,
  { maxWidth: leftWidth }
);

noteY += 20;

const line2 = doc.splitTextToSize(
  'For IMEI / Serial number information, please refer to packaging / warranty slip.',
  leftWidth
);

doc.text(line2, leftX, noteY);
noteY += line2.length * 14;   

noteY += 6;

const line3 = doc.splitTextToSize(
  'Note: Effective 1st Feb 2026, The valuation of the tobacco and pan masala products is made in accordance with Rule 31D of the CGST Rules, 2017.',
  leftWidth
);

doc.text(line3, leftX, noteY);

noteY += line3.length * 14 + 15;   // Move below GST block

/* ================== SIGNATURE ================== */

const signatureImg = new Image();
signatureImg.src = 'assets/logo/Sign.png';

await new Promise(resolve => {
  signatureImg.onload = () => {

    const signatureWidth = 120;
    const signatureHeight = 45;

    const signatureX = pageWidth - margin - signatureWidth;
    const signatureTopY = sectionY - 5;;

    doc.addImage(
      signatureImg,
      'PNG',
      signatureX,
      signatureTopY,
      signatureWidth,
      signatureHeight
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    doc.text(
      'Authorized Signatory',
      signatureX + signatureWidth / 2,
      signatureTopY + signatureHeight + 12,
      { align: 'center' }
    );

    resolve(true);
  };
});

/* =============================
   FOOTER BLOCK (AUTO PAGE SAFE)
============================== */

const footerMargin = 60;
const columnGap = 80;

const usableWidth = pageWidth - footerMargin * 2;
const columnWidth = (usableWidth - columnGap) / 2;

const leftColumnX = footerMargin;
const rightColumnX = footerMargin + columnWidth + columnGap;

// Start footer right below GST block
let footerStartY = noteY + 20;

// Estimate footer height (~90px safe)
const estimatedFooterHeight = 90;

// Page height
const currentPageHeight  = doc.internal.pageSize.height;

// If not enough space, THEN add page
if (footerStartY + estimatedFooterHeight > currentPageHeight  - 20) {
  doc.addPage();
  footerStartY = 85; // reset position on new page
}

let leftY = footerStartY;
let rightY = footerStartY;

/* ========= LEFT COLUMN ========= */

doc.setFont('times', 'bold');
doc.setFontSize(10);
doc.text('Order Delivered From -', leftColumnX, leftY);

leftY += 12;

doc.setFont('times', 'normal');
doc.setFontSize(8);

const leftContent =
  'Silora Private Limited (Formerly Known as Kiranakart Technologies Private Limited)';

const leftLines = doc.splitTextToSize(leftContent, columnWidth);
doc.text(leftLines, leftColumnX, leftY);
leftY += leftLines.length * 10;

const leftAddress =
  'Plot No:303, Srinivasa Enclave, Z.P Road, Hastinapuram, Nagarjuna Sagar Road, LB Nagar, Hyderabad - 500074';

const leftAddressLines = doc.splitTextToSize(leftAddress, columnWidth);
doc.text(leftAddressLines, leftColumnX, leftY);
leftY += leftAddressLines.length * 10;

doc.text('FSSAI:', leftColumnX, leftY);


/* ========= RIGHT COLUMN ========= */

doc.setFont('times', 'bold');
doc.setFontSize(10);

doc.text(
  'E-commerce Platform (FBO) Information -',
  rightColumnX + columnWidth / 2,
  rightY,
  { align: 'center' }
);

rightY += 12;

doc.setFont('times', 'normal');
doc.setFontSize(8);

doc.text(
  'SILORA MARKETPLACE PRIVATE LIMITED',
  rightColumnX + columnWidth / 2,
  rightY,
  { align: 'center' }
);

rightY += 10;

const rightAddress =
  'First Floor, 773, Sarjapur Main Road, Kaikondarahalli, Bellandur, Bangalore, Karnataka, India 560103';

const rightLines = doc.splitTextToSize(rightAddress, columnWidth);

doc.text(
  rightLines,
  rightColumnX + columnWidth / 2,
  rightY,
  { align: 'center' }
);

rightY += rightLines.length * 10;

doc.text(
  'FSSAI Lic. No: 11224999000872',
  rightColumnX + columnWidth / 2,
  rightY,
  { align: 'center' }
);

rightY += 10;

doc.text(
  'Email: support@silora.com',
  rightColumnX + columnWidth / 2,
  rightY,
  { align: 'center' }
);

/* ================= SAVE ================= */

  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const newTab = window.open('', '_blank');

  if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <title>Invoice Details</title>
          </head>
          <body style="margin:0">
            <iframe 
              src="${blobUrl}" 
              frameborder="0" 
              style="width:100%; height:100vh;">
            </iframe>
          </body>
        </html>
      `);
      newTab.document.close();
    }
    }

/* ================== Number To Words ==================== */

private numberToWords(num: number): string {

  if (num === 0) return 'Zero Rupees Only';

  const ones: string[] = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six',
    'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
    'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens: string[] = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
    'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const convertBelowThousand = (n: number): string => {
    let str = '';

    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n = n % 100;
    }

    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n = n % 10;
    }

    if (n > 0) {
      str += ones[n] + ' ';
    }

    return str.trim();
  };

  let result = '';
  let remaining = num;

  if (remaining >= 10000000) {
    result += convertBelowThousand(Math.floor(remaining / 10000000)) + ' Crore ';
    remaining %= 10000000;
  }

  if (remaining >= 100000) {
    result += convertBelowThousand(Math.floor(remaining / 100000)) + ' Lakh ';
    remaining %= 100000;
  }

  if (remaining >= 1000) {
    result += convertBelowThousand(Math.floor(remaining / 1000)) + ' Thousand ';
    remaining %= 1000;
  }

  if (remaining > 0) {
    result += convertBelowThousand(remaining);
  }

  return result.trim() + ' Rupees Only';
}

// ================= REFUND ORDER =================

refundOrder() {
  console.log('Refund clicked');
  // Add refund logic here later
}

}