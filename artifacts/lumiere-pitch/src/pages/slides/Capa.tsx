const base = import.meta.env.BASE_URL;

export default function Capa() {
  return (
    <div className="w-screen h-screen overflow-hidden relative" style={{ background: "#060c1a" }}>
      <img
        src={`${base}hero-salon.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        alt=""
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, rgba(6,12,26,0.95) 0%, rgba(6,12,26,0.78) 55%, rgba(6,12,26,0.93) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-[8vw]">
        <div
          className="w-[3vw] h-[0.2vh] mb-[3vh]"
          style={{ background: "#e8b23a" }}
        />
        <h1
          className="font-display font-bold tracking-tighter leading-none mb-[2.5vh]"
          style={{ fontSize: "8vw", color: "#e8b23a", textWrap: "balance" }}
        >
          Lumière.io
        </h1>
        <p
          className="font-body font-light uppercase mb-[4vh]"
          style={{
            fontSize: "2vw",
            color: "#f9f7f0",
            letterSpacing: "0.3em",
          }}
        >
          Gestão de salão de alto padrão
        </p>
        <div
          className="w-[3vw] h-[0.2vh] mb-[3vh]"
          style={{ background: "#e8b23a" }}
        />
        <p className="font-body" style={{ fontSize: "1.8vw", color: "#9d9a8c" }}>
          Para o mercado lusófono · 2026
        </p>
      </div>
    </div>
  );
}
