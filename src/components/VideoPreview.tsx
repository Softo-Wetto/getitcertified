"use client";

type Props = {
  src: string;
};

export default function VideoPreview({ src }: Props) {
  return (
    <video
      controls
      preload="metadata"
      className="h-full w-full bg-black object-contain"
      src={src}
    />
  );
}
