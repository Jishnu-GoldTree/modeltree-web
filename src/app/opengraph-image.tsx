import { ImageResponse } from "next/og";

import { BrandFrame, ogAlt, ogContentType, ogSize } from "@/lib/og/brand-frame";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return new ImageResponse(<BrandFrame />, size);
}
