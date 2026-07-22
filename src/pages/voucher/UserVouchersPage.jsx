import React from "react";
import Navbar from "../../components/navbar/Navbar";
import VoucherList from "../../components/voucher/VoucherList";

export default function UserVouchersPage() {
  return (
    <div className="user-vouchers-page">
      <Navbar />
      <VoucherList />
    </div>
  );
}
