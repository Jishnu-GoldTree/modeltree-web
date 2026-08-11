import { ImageResponse } from "next/og";

import { BrandMark } from "@/lib/og/brand-mark";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandMark size={size.width} radius={6} />, size);
}
