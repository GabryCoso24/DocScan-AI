"use client";

interface ToastProps {
  message: string;
  type: "success" | "error";
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {message}
      </div>
    </div>
  );
}
