export default function OPedido() {
  return (
    <div
      className="w-screen h-screen overflow-hidden relative"
      style={{ background: "#060c1a" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(232,178,58,0.05) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute"
        style={{
          left: "8vw",
          top: "20vh",
          bottom: "20vh",
          width: "0.3vw",
          background:
            "linear-gradient(180deg, transparent, #e8b23a 30%, #e8b23a 70%, transparent)",
        }}
      />

      <div className="absolute top-[3.5vh] right-[5vw]">
        <span
          className="font-display font-semibold"
          style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.15em" }}
        >
          LUMIÈRE.IO
        </span>
      </div>

      <div className="absolute inset-0 flex flex-col justify-center px-[14vw]">
        <p
          className="font-body uppercase mb-[2vh]"
          style={{ fontSize: "1.5vw", color: "#e8b23a", letterSpacing: "0.2em" }}
        >
          O Pedido
        </p>
        <h2
          className="font-display font-bold tracking-tight leading-tight mb-[1.5vh]"
          style={{ fontSize: "5vw", color: "#f9f7f0" }}
        >
          <span className="block">Rodada</span>
          <span className="block" style={{ color: "#e8b23a" }}>
            Pré-Semente
          </span>
        </h2>

        <div className="flex items-baseline gap-[2vw] mb-[4vh]">
          <span
            className="font-display font-bold"
            style={{ fontSize: "5.5vw", color: "#e8b23a" }}
          >
            R$ 600 mil
          </span>
          <span
            className="font-body"
            style={{ fontSize: "2vw", color: "#9d9a8c" }}
          >
            cap de valuation R$ 5M
          </span>
        </div>

        <div
          className="w-[5vw] h-[0.2vh] mb-[1.5vh]"
          style={{ background: "#e8b23a" }}
        />

        <p
          className="font-body mb-[4vh]"
          style={{ fontSize: "1.8vw", color: "#9d9a8c" }}
        >
          Runway de <span style={{ color: "#f9f7f0" }}>18 meses</span> — do produto completo ao
          crescimento escalável
        </p>

        <div className="flex gap-[4vw]">
          <div>
            <p
              className="font-display font-semibold mb-[0.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              40% — Produto
            </p>
            <p className="font-body" style={{ fontSize: "1.8vw", color: "#9d9a8c" }}>
              Desenvolvimento e infraestrutura
            </p>
          </div>

          <div>
            <p
              className="font-display font-semibold mb-[0.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              35% — Go-to-Market
            </p>
            <p className="font-body" style={{ fontSize: "1.8vw", color: "#9d9a8c" }}>
              Aquisição e parcerias com salões
            </p>
          </div>

          <div>
            <p
              className="font-display font-semibold mb-[0.5vh]"
              style={{ fontSize: "2.2vw", color: "#f9f7f0" }}
            >
              25% — Equipe
            </p>
            <p className="font-body" style={{ fontSize: "1.8vw", color: "#9d9a8c" }}>
              Crescimento da equipe técnica
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
