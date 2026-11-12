import { useState, type ComponentProps } from "react";

const dojoLogo = "/assets/kaizen-logo-1-rb_d77ba5e7.png";
type Props = Omit<ComponentProps<"img">, "onError" | "srcSet">;

export function MediaImage(props: Props) {
  return <ImageWithFallback key={props.src} {...props} />;
}

function ImageWithFallback({ src, style, ...props }: Props) {
  const [failed, setFailed] = useState(false);
  const fallback = failed || !src;
  return (
    <img
      {...props}
      src={fallback ? dojoLogo : src}
      style={fallback ? { ...style, objectFit: "contain", padding: "12px" } : style}
      onError={fallback ? undefined : () => setFailed(true)}
    />
  );
}
