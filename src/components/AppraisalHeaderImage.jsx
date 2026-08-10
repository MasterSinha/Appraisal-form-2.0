const LOGO_SOURCES = {
  dypiu: { src: "/image.png", alt: "DYPIU" },
  iqas: { src: "/IQAS.png", alt: "IQAS" },
};

export default function AppraisalHeaderImage({ height = 88, style = {}, logo = "dypiu" }) {
  const { src, alt } = LOGO_SOURCES[logo] || LOGO_SOURCES.dypiu;
  return (
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
  );
}
