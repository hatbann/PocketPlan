"use client";
import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <div className="">
      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        onClick={() => router.push("/overview")}
      >
        Overview
      </button>
    </div>
  );
}
