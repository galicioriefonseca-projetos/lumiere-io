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
          className="font-display font-bold tracking-tight leading-tight mb-[4vh]"
          style={{ fontSize: "5vw", color: "#f9f7f0" }}
        >
          <span className="block">Rodada</span>
          <span className="block" style={{ color: "#e8b23a" }}>
            Pré-Semente
          </span>
        </h2>
        <div
          className="w-[5vw] h-[0.2vh] mb-[5vh]"
          style={{ background: "#e8b23a" }}
        />

        <div className="flex gap-[6vw]">
          <div>
            <p
              className="font-display font-semibold mb-[0.8vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Produto
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
              Desenvolvimento e infraestrutura
            </p>
          </div>

          <div>
            <p
              className="font-display font-semibold mb-[0.8vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Go-to-Market
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
              Aquisição e parcerias com salões
            </p>
          </div>

          <div>
            <p
              className="font-display font-semibold mb-[0.8vh]"
              style={{ fontSize: "2.5vw", color: "#f9f7f0" }}
            >
              Equipe
            </p>
            <p className="font-body" style={{ fontSize: "2vw", color: "#9d9a8c" }}>
              Crescimento da equipe técnica
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
