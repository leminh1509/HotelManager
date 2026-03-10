import React, { createContext, useContext, useState, useCallback } from "react";

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  // Dữ liệu phòng đang xem / đang book
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Dữ liệu form booking (persist qua các step)
  const [bookingData, setBookingData] = useState({
    // Từ search
    checkinDate: null,
    checkinTime: "14:00",
    checkoutDate: null,
    checkoutTime: "12:00",
    guestCount: 1,
    // Guest info (step 1)
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    guestIdNumber: "",
    guestNationality: "",
    guestAddress: "",
    specialRequest: "",
    earlyCheckin: false,
    lateCheckout: false,
  });

  // Kết quả sau khi booking thành công
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const updateBookingData = useCallback((partial) => {
    setBookingData((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetBooking = useCallback(() => {
    setSelectedRoom(null);
    setBookingData({
      checkinDate: null,
      checkinTime: "14:00",
      checkoutDate: null,
      checkoutTime: "12:00",
      guestCount: 1,
      guestName: "",
      guestEmail: "",
      guestPhone: "",
      guestIdNumber: "",
      guestNationality: "",
      guestAddress: "",
      specialRequest: "",
      earlyCheckin: false,
      lateCheckout: false,
    });
    setConfirmedBooking(null);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        selectedRoom,
        setSelectedRoom,
        bookingData,
        updateBookingData,
        confirmedBooking,
        setConfirmedBooking,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking phải dùng bên trong <BookingProvider>");
  return ctx;
}