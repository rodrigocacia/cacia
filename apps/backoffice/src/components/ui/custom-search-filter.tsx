"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, InputHTMLAttributes } from "react";
import { IoMdSearch } from "react-icons/io";

type CustomSearchFilterProps = InputHTMLAttributes<HTMLInputElement>;

export function CustomSearchFilter(props: CustomSearchFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [value, setValue] = useState(initialSearch);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    }, 500);

    return () => clearTimeout(timeout);
  }, [value, router]);

  return (
    <div className="bg-white rounded-[10px] px-3 flex items-center gap-3 border border-[#F6F6F9] min-w-[340px] max-md:w-full max-md:h-[52px] h-auto py-2">
      <IoMdSearch size={20} className="text-[#BDBDBD]" />
      <input
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.onChange?.(e);
        }}
        className={`w-full bg-transparent text-sm text-[#333] placeholder-[#BDBDBD] outline-none ${
          props.className || ""
        }`}
      />
    </div>
  );
}
