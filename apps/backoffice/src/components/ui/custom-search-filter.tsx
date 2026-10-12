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
    <div className="flex h-11 w-full max-w-[360px] items-center gap-2 rounded-[10px] border border-filete-forte bg-white px-3.5 transition-[border-color,box-shadow] duration-150 focus-within:border-acao focus-within:shadow-[0_0_0_3px_#D7EBEE] max-md:max-w-none">
      <IoMdSearch size={18} className="shrink-0 text-gray-400" />
      <input
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.onChange?.(e);
        }}
        className={`w-full bg-transparent text-[14.5px] text-tinta placeholder-gray-400 outline-none ${
          props.className || ""
        }`}
      />
    </div>
  );
}
