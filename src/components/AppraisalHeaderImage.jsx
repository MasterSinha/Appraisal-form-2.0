const LOGO_SOURCES = {
  dypiu: { src: "/image.png", webp: "/image.webp", alt: "DYPIU" },
  iqas: { src: "/IQAS.png", webp: "/IQAS.webp", alt: "IQAS" },
};

export default function AppraisalHeaderImage({ height = 88, style = {}, logo = "dypiu" }) {
  const { src, webp, alt } = LOGO_SOURCES[logo] || LOGO_SOURCES.dypiu;
  return (
    <picture>
      <source srcSet={webp} type="image/webp" />
      <img
        src={src}
        alt={alt}
        style={{
          height,
          width: "auto",
          maxWidth: "min(36vw, 320px)",
          objectFit: "contain",
          display: "block",
          flexShrink: 0,
          ...style,
        }}
      />
    </picture>
  );
}
